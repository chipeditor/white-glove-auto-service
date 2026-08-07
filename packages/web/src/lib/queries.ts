import { createServerSupabaseClient } from './supabase-server';
import type {
  Vehicle,
  VehicleWithCustomer,
  Customer,
  ServiceRequest,
  ServiceRequestWithVehicle,
  ServiceRequestWithDetails,
  RepairOrderLine,
  Inspection,
  InspectionSection,
  InspectionItem,
  Checklist,
  ChecklistItem,
  ChecklistWithDetails,
  Notification,
  AffiliateRecommendation,
  User,
  AuditAction,
} from '@/shared/types';
import type { UploadedFile } from '@/components/ui/FileUpload';

async function getOrgId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  return membership?.organization_id ?? null;
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as User | null;
}

export async function fetchVehicles(): Promise<VehicleWithCustomer[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false });

  return (vehicles ?? []) as VehicleWithCustomer[];
}

export async function fetchVehicle(id: string): Promise<VehicleWithCustomer | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single();

  return data as VehicleWithCustomer | null;
}

export interface DashboardStats {
  vehicles_in_service: number;
  ready_for_delivery: number;
  awaiting_approval: number;
  completed_this_week: number;
  total_vehicles: number;
  total_customers: number;
  active_service_requests: number;
  pending_approvals: number;
  revenue_approved: number;
  revenue_pending: number;
  vehicle_statuses: Record<string, number>;
  sr_statuses: Record<string, number>;
  recent_activity: Array<{
    id: string;
    type: string;
    title: string;
    status: string;
    date: string;
    vehicle?: string;
    technician?: string;
  }>;
}

export async function fetchDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return null;

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const [vehiclesRes, srRes, customersRes, linesRes, approvalsRes, recentSrsRes] = await Promise.all([
    supabase.from('vehicles').select('id, status').eq('organization_id', orgId),
    supabase.from('service_requests').select('id, status, title, created_at, vehicle:vehicles(year, make, model)').eq('organization_id', orgId).order('updated_at', { ascending: false }),
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
    supabase.from('repair_order_lines').select('quantity, unit_price, status, service_request_id').eq('organization_id', orgId),
    supabase.from('approval_requests').select('id, status, created_at').eq('organization_id', orgId).eq('status', 'pending'),
    supabase.from('service_requests').select('id, title, status, updated_at, vehicle:vehicles(year, make, model), technician:users!service_requests_technician_id_fkey(full_name)').eq('organization_id', orgId).order('updated_at', { ascending: false }).limit(10),
  ]);

  const vehicles = vehiclesRes.data ?? [];
  const srs = srRes.data ?? [];
  const lines = linesRes.data ?? [];
  const recentSrs = recentSrsRes.data ?? [];

  const vehicleStatuses: Record<string, number> = {};
  let vehiclesInService = 0;
  let readyForDelivery = 0;
  let awaitingApproval = 0;
  let completedThisWeek = 0;

  for (const v of vehicles) {
    vehicleStatuses[v.status] = (vehicleStatuses[v.status] || 0) + 1;
    if (v.status === 'in_service') vehiclesInService++;
    if (v.status === 'ready_for_delivery') readyForDelivery++;
    if (v.status === 'awaiting_approval') awaitingApproval++;
    if (v.status === 'delivered') completedThisWeek++;
  }

  const srStatuses: Record<string, number> = {};
  let activeSrs = 0;
  for (const sr of srs) {
    srStatuses[sr.status] = (srStatuses[sr.status] || 0) + 1;
    if (!['completed', 'draft', 'declined'].includes(sr.status)) activeSrs++;
  }

  let revenueApproved = 0;
  let revenuePending = 0;
  for (const line of lines) {
    const total = (line.quantity ?? 1) * (line.unit_price ?? 0);
    if (line.status === 'approved') revenueApproved += total;
    else if (line.status === 'pending') revenuePending += total;
  }

  const activity = recentSrs.map((sr: Record<string, unknown>) => {
    const v = sr.vehicle as Record<string, unknown> | null;
    const t = sr.technician as Record<string, unknown> | null;
    return {
      id: sr.id as string,
      type: 'service_request',
      title: sr.title as string,
      status: sr.status as string,
      date: sr.updated_at as string,
      vehicle: v ? `${v.year ?? ''} ${v.make} ${v.model}`.trim() : undefined,
      technician: t ? (t.full_name as string) : undefined,
    };
  });

  return {
    vehicles_in_service: vehiclesInService,
    ready_for_delivery: readyForDelivery,
    awaiting_approval: awaitingApproval,
    completed_this_week: completedThisWeek,
    total_vehicles: vehicles.length,
    total_customers: customersRes.count ?? 0,
    active_service_requests: activeSrs,
    pending_approvals: (approvalsRes.data ?? []).length,
    revenue_approved: revenueApproved,
    revenue_pending: revenuePending,
    vehicle_statuses: vehicleStatuses,
    sr_statuses: srStatuses,
    recent_activity: activity,
  };
}

export async function fetchServiceRequests(): Promise<ServiceRequestWithVehicle[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*), technician:users!service_requests_technician_id_fkey(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []) as ServiceRequestWithVehicle[];
}

export async function fetchServiceRequest(id: string): Promise<ServiceRequestWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*), advisor:users!service_requests_advisor_id_fkey(*), technician:users!service_requests_technician_id_fkey(*)')
    .eq('id', id)
    .single();

  if (!data) return null;

  const [inspections, checklists, lines] = await Promise.all([
    supabase.from('inspections').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
    supabase.from('checklists').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
    supabase.from('repair_order_lines').select('*').eq('service_request_id', id).order('sort_order'),
  ]);

  return {
    ...data,
    inspections: inspections.data ?? [],
    checklists: checklists.data ?? [],
    lines: lines.data ?? [],
  } as ServiceRequestWithDetails;
}

/// Roles that can be assigned work. Excludes `customer`, who holds a
/// membership but must never appear in a technician picker.
const STAFF_ROLES = [
  'super_admin',
  'shop_admin',
  'service_advisor',
  'technician',
  'delivery_specialist',
];

export async function fetchOrgUsers(): Promise<User[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id, users(*)')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('role', STAFF_ROLES);

  return (memberships ?? [])
    .map((m: Record<string, unknown>) => m.users)
    .filter(Boolean) as User[];
}

export interface InspectionWithDetails extends Inspection {
  vehicle: { year: number | null; make: string; model: string } | null;
  service_request: { title: string } | null;
  inspector: { full_name: string } | null;
}

export async function fetchAllInspections(): Promise<InspectionWithDetails[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('inspections')
    .select('*, vehicle:vehicles(year, make, model), service_request:service_requests(title), inspector:users!inspections_inspector_id_fkey(full_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []) as InspectionWithDetails[];
}

export async function fetchInspections(vehicleId: string): Promise<Inspection[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Inspection[];
}

export interface InspectionDetail extends Inspection {
  vehicle: (Vehicle & { customer: Customer | null }) | null;
  service_request: { id: string; title: string } | null;
  inspector: { full_name: string } | null;
}

export async function fetchInspection(id: string): Promise<InspectionDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('inspections')
    .select(
      '*, vehicle:vehicles(*, customer:customers(*)), service_request:service_requests(id, title), inspector:users!inspections_inspector_id_fkey(full_name)'
    )
    .eq('id', id)
    .single();

  return (data as InspectionDetail) ?? null;
}

export interface DamageMarkerRow {
  id: string;
  x_position: number | null;
  y_position: number | null;
  severity: 'minor' | 'moderate' | 'severe';
  description: string | null;
}

export async function fetchDamageMarkers(inspectionId: string): Promise<DamageMarkerRow[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('damage_markers')
    .select('id, x_position, y_position, severity, description')
    .eq('inspection_id', inspectionId)
    .order('created_at');

  return (data ?? []) as DamageMarkerRow[];
}

export async function fetchInspectionSections(
  inspectionId: string
): Promise<(InspectionSection & { items: InspectionItem[] })[]> {
  const supabase = await createServerSupabaseClient();

  const { data: sections } = await supabase
    .from('inspection_sections')
    .select('*, items:inspection_items(*)')
    .eq('inspection_id', inspectionId)
    .order('sort_order');

  return (sections ?? []) as (InspectionSection & { items: InspectionItem[] })[];
}

export async function fetchChecklists(vehicleId: string): Promise<(Checklist & { items: ChecklistItem[] })[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('checklists')
    .select('*, items:checklist_items(*)')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  return (data ?? []) as (Checklist & { items: ChecklistItem[] })[];
}

export async function fetchAllChecklists(): Promise<ChecklistWithDetails[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('checklists')
    .select(
      '*, vehicle:vehicles(year, make, model), service_request:service_requests(title), assigned_user:users!checklists_assigned_to_fkey(full_name)'
    )
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []) as ChecklistWithDetails[];
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Notification[];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name');

  return (data ?? []) as Customer[];
}

export async function fetchInspectionReport(inspectionId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: inspection } = await supabase
    .from('inspections')
    .select('*, vehicle:vehicles(*, customer:customers(*)), technician:users!inspections_technician_id_fkey(*), service_request:service_requests(*)')
    .eq('id', inspectionId)
    .single();

  if (!inspection) return null;

  const { data: sections } = await supabase
    .from('inspection_sections')
    .select('*, items:inspection_items(*)')
    .eq('inspection_id', inspectionId)
    .order('sort_order');

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', (inspection.vehicle as Record<string, unknown>)?.organization_id as string)
    .single();

  return {
    inspection,
    sections: sections ?? [],
    organization: org,
  };
}

export async function fetchEstimateReport(serviceRequestId: string) {
  const supabase = await createServerSupabaseClient();

  const { data: sr } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*, customer:customers(*)), advisor:users!service_requests_advisor_id_fkey(*)')
    .eq('id', serviceRequestId)
    .single();

  if (!sr) return null;

  const { data: lines } = await supabase
    .from('repair_order_lines')
    .select('*')
    .eq('service_request_id', serviceRequestId)
    .order('sort_order');

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', sr.organization_id)
    .single();

  return {
    serviceRequest: sr,
    lines: lines ?? [],
    organization: org,
  };
}

export async function fetchAffiliateRecommendations(
  vehicleId: string
): Promise<AffiliateRecommendation[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('affiliate_recommendations')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true);

  return (data ?? []) as AffiliateRecommendation[];
}

// ===========================================
// Vehicle detail tabs
// ===========================================

/// An inspection plus the two things the vehicle detail list needs that do not
/// live on the row itself: who ran it, and how far through the items it got.
export interface VehicleInspectionSummary extends Inspection {
  inspector: { full_name: string } | null;
  service_request: { id: string; title: string } | null;
  checked_items: number;
  total_items: number;
}

export async function fetchVehicleInspections(
  vehicleId: string
): Promise<VehicleInspectionSummary[]> {
  const supabase = await createServerSupabaseClient();

  const { data: inspections } = await supabase
    .from('inspections')
    .select(
      '*, inspector:users!inspections_inspector_id_fkey(full_name), service_request:service_requests(id, title)'
    )
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  const rows = (inspections ?? []) as (Inspection & {
    inspector: { full_name: string } | null;
    service_request: { id: string; title: string } | null;
  })[];

  if (rows.length === 0) return [];

  // inspection_items hang off sections, so progress has to come through them.
  const { data: sections } = await supabase
    .from('inspection_sections')
    .select('inspection_id, items:inspection_items(passed)')
    .in(
      'inspection_id',
      rows.map((r) => r.id)
    );

  const progress: Record<string, { checked: number; total: number }> = {};
  for (const section of (sections ?? []) as {
    inspection_id: string;
    items: { passed: boolean | null }[] | null;
  }[]) {
    const bucket = (progress[section.inspection_id] ??= { checked: 0, total: 0 });
    for (const item of section.items ?? []) {
      bucket.total += 1;
      if (item.passed !== null) bucket.checked += 1;
    }
  }

  return rows.map((row) => ({
    ...row,
    checked_items: progress[row.id]?.checked ?? 0,
    total_items: progress[row.id]?.total ?? 0,
  }));
}

export interface VehicleServiceRequestSummary extends ServiceRequest {
  technician: { full_name: string } | null;
  advisor: { full_name: string } | null;
}

export async function fetchVehicleServiceRequests(
  vehicleId: string
): Promise<VehicleServiceRequestSummary[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('service_requests')
    .select(
      '*, technician:users!service_requests_technician_id_fkey(full_name), advisor:users!service_requests_advisor_id_fkey(full_name)'
    )
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  return (data ?? []) as VehicleServiceRequestSummary[];
}

export async function fetchVehicleMedia(vehicleId: string): Promise<UploadedFile[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('media_assets')
    .select('id, url, file_name, file_size, mime_type, type, caption, created_at')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  // file_name/file_size/mime_type are nullable in the schema but FileUpload
  // renders them unconditionally, so fill the gaps here rather than there.
  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: row.id as string,
    url: row.url as string,
    file_name: (row.file_name as string | null) ?? 'Untitled file',
    file_size: (row.file_size as number | null) ?? 0,
    mime_type: (row.mime_type as string | null) ?? 'application/octet-stream',
    type: row.type as string,
    caption: (row.caption as string | null) ?? null,
    created_at: row.created_at as string,
  }));
}

export interface VehicleHistoryEvent {
  id: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  actor_name?: string;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

/// Audit trail for a vehicle: events logged against the vehicle itself plus
/// those against its service requests and inspections, which is where most of
/// the interesting activity actually lands.
export async function fetchVehicleHistory(vehicleId: string): Promise<VehicleHistoryEvent[]> {
  const supabase = await createServerSupabaseClient();

  const [srRes, inspRes] = await Promise.all([
    supabase.from('service_requests').select('id').eq('vehicle_id', vehicleId),
    supabase.from('inspections').select('id').eq('vehicle_id', vehicleId),
  ]);

  const entityIds = [
    vehicleId,
    ...((srRes.data ?? []) as { id: string }[]).map((r) => r.id),
    ...((inspRes.data ?? []) as { id: string }[]).map((r) => r.id),
  ];

  const { data: events } = await supabase
    .from('audit_events')
    .select('id, action, entity_type, entity_id, actor_id, changes, metadata, created_at')
    .in('entity_id', entityIds)
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = (events ?? []) as VehicleHistoryEvent[];
  if (rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((e) => e.actor_id).filter(Boolean))] as string[];
  let actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: users } = await supabase.from('users').select('id, full_name').in('id', actorIds);
    actorMap = Object.fromEntries(
      ((users ?? []) as { id: string; full_name: string }[]).map((u) => [u.id, u.full_name])
    );
  }

  return rows.map((e) => ({
    ...e,
    actor_name: e.actor_id ? actorMap[e.actor_id] : undefined,
  }));
}
