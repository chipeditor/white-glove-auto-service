import { createClient } from '@supabase/supabase-js';
import type {
  HealthBoardSR,
  HealthStatus,
  ShopPulse,
  TechLane,
  TechCapacity,
  User,
  Vehicle,
} from '@/shared/types';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface HealthBoardData {
  pulse: ShopPulse;
  lanes: TechLane[];
  timeline: TimelineEntry[];
}

export interface TimelineEntry {
  id: string;
  vehicle_label: string;
  promised_at: string | null;
  status: string;
  health_status: HealthStatus;
  total_labor_hours: number;
  completed_labor_hours: number;
  parts_hold: boolean;
  max_parts_eta_days: number | null;
  created_at: string;
  active_sublets: number;
}

function computeHealthStatus(
  sr: HealthBoardSR,
  bufferHours: number
): HealthStatus {
  if (!sr.promised_at) return 'on_track';

  const now = new Date();
  const promised = new Date(sr.promised_at);

  if (now > promised) return 'overdue';

  if (sr.parts_ordered_count > 0 || sr.parts_backordered_count > 0 || sr.lines_on_hold > 0) {
    return 'blocked';
  }

  const remainingHours = sr.total_labor_hours - sr.completed_labor_hours;
  const hoursUntilPromised = (promised.getTime() - now.getTime()) / (1000 * 60 * 60);
  const hoursNeeded = remainingHours + bufferHours;

  if (hoursNeeded > hoursUntilPromised) return 'at_risk';
  if (hoursNeeded > hoursUntilPromised * 0.7) return 'tight';

  return 'on_track';
}

export async function fetchHealthBoardData(orgId: string): Promise<HealthBoardData> {
  const supabase = getServiceClient();

  const [boardRes, techsRes, capacityRes, comebacksRes, orgRes, completedRes] =
    await Promise.all([
      supabase.from('health_board_sr').select('*').eq('organization_id', orgId),
      supabase
        .from('memberships')
        .select('user_id, role, user:users!inner(*)')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .in('role', ['technician', 'shop_admin']),
      supabase.from('tech_capacity').select('*').eq('organization_id', orgId),
      supabase
        .from('comebacks')
        .select('id, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('organizations')
        .select('default_buffer_hours, bay_count')
        .eq('id', orgId)
        .single(),
      supabase
        .from('service_requests')
        .select('id, promised_at, actual_completion')
        .eq('organization_id', orgId)
        .eq('status', 'completed')
        .gte(
          'actual_completion',
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        ),
    ]);

  const boardRows = (boardRes.data ?? []) as HealthBoardSR[];
  const techRows = techsRes.data ?? [];
  const capacityRows = (capacityRes.data ?? []) as TechCapacity[];
  const comebackRows = comebacksRes.data ?? [];
  const org = orgRes.data ?? { default_buffer_hours: 4, bay_count: 4 };
  const completedSrs = completedRes.data ?? [];

  const bufferHours = Number(org.default_buffer_hours) || 4;
  const bayCount = org.bay_count || 4;

  // Fetch vehicles for all active SRs
  const vehicleIds = [...new Set(boardRows.map((r) => r.vehicle_id))];
  const vehiclesRes = vehicleIds.length
    ? await supabase.from('vehicles').select('*').in('id', vehicleIds)
    : { data: [] };
  const vehicleMap = new Map(
    ((vehiclesRes.data ?? []) as Vehicle[]).map((v) => [v.id, v])
  );

  // Compute health status for each SR
  const enriched = boardRows.map((sr) => ({
    ...sr,
    vehicle: vehicleMap.get(sr.vehicle_id) ?? ({} as Vehicle),
    health_status: computeHealthStatus(sr, bufferHours),
    remaining_hours: Math.max(0, sr.total_labor_hours - sr.completed_labor_hours),
  }));

  // Build tech lanes
  const capacityMap = new Map(capacityRows.map((c) => [c.user_id, c]));
  const lanes: TechLane[] = techRows.map((row) => {
    const user = row.user as unknown as User;
    const techJobs = enriched
      .filter((sr) => sr.technician_id === user.id)
      .sort((a, b) => b.priority - a.priority);

    return {
      tech: user,
      capacity: capacityMap.get(user.id) ?? null,
      jobs: techJobs,
    };
  });

  // Build pulse
  const atRisk = enriched.filter((sr) =>
    ['at_risk', 'overdue', 'blocked'].includes(sr.health_status)
  );
  const aging = enriched.filter((sr) => {
    const daysInShop =
      (Date.now() - new Date(sr.created_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysInShop >= 5;
  });

  let onTimeCount = 0;
  for (const sr of completedSrs) {
    if (sr.promised_at && sr.actual_completion) {
      if (new Date(sr.actual_completion) <= new Date(sr.promised_at)) {
        onTimeCount++;
      }
    }
  }
  const onTimePct = completedSrs.length > 0
    ? Math.round((onTimeCount / completedSrs.length) * 100)
    : 100;

  // Comeback streak: days since last comeback
  let streakDays = 0;
  if (comebackRows.length === 0) {
    const oldestCompleted = completedSrs
      .map((s) => new Date(s.actual_completion!))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    streakDays = oldestCompleted
      ? Math.floor((Date.now() - oldestCompleted.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  } else {
    const lastComeback = comebackRows
      .map((c) => new Date(c.created_at))
      .sort((a, b) => b.getTime() - a.getTime())[0];
    streakDays = Math.floor(
      (Date.now() - lastComeback.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  const atRiskReasons = atRisk
    .slice(0, 2)
    .map((sr) => {
      const v = sr.vehicle;
      const label = v?.year ? `${v.year} ${v.make}` : sr.title;
      if (sr.health_status === 'blocked') return `${label} — parts`;
      if (sr.health_status === 'overdue') return `${label} — overdue`;
      return `${label} — tight`;
    })
    .join(', ');

  const agingDetail = aging
    .slice(0, 1)
    .map((sr) => {
      const v = sr.vehicle;
      const label = v?.year ? `${v.year} ${v.make} ${v.model}` : sr.title;
      const reason =
        sr.parts_ordered_count > 0 || sr.parts_backordered_count > 0
          ? 'parts'
          : 'in progress';
      return `${label} — ${reason}`;
    })
    .join('');

  const pulse: ShopPulse = {
    on_time_pct: onTimePct,
    on_time_trend: 0,
    vehicles_active: enriched.length,
    bay_count: bayCount,
    at_risk_count: atRisk.length,
    at_risk_reasons: atRiskReasons,
    aging_count: aging.length,
    aging_detail: agingDetail,
    comeback_count_30d: comebackRows.length,
    comeback_streak_days: streakDays,
  };

  // Build timeline
  const timeline: TimelineEntry[] = enriched.map((sr) => {
    const v = sr.vehicle;
    const label = v?.year ? `${v.year} ${v.make} ${v.model}` : sr.title;
    return {
      id: sr.id,
      vehicle_label: label,
      promised_at: sr.promised_at,
      status: sr.status,
      health_status: sr.health_status,
      total_labor_hours: sr.total_labor_hours,
      completed_labor_hours: sr.completed_labor_hours,
      parts_hold:
        sr.parts_ordered_count > 0 || sr.parts_backordered_count > 0,
      max_parts_eta_days: sr.max_parts_eta_days,
      created_at: sr.created_at,
      active_sublets: sr.active_sublets,
    };
  });

  return { pulse, lanes, timeline };
}
