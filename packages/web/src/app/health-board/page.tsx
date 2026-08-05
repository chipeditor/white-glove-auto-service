'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Wrench,
  Package,
  Timer,
  Shield,
} from 'lucide-react';
import type {
  HealthStatus,
  ShopPulse,
  TechLane,
} from '@/shared/types';

interface TimelineEntry {
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

interface HealthBoardData {
  pulse: ShopPulse;
  lanes: TechLane[];
  timeline: TimelineEntry[];
}

const STATUS_COLORS: Record<HealthStatus, string> = {
  on_track: '#c8a45c',
  tight: '#9ca3af',
  at_risk: '#e87040',
  blocked: '#e87040',
  overdue: '#ff3b3b',
};

const STATUS_BORDER: Record<HealthStatus, string> = {
  on_track: 'border-l-[#c8a45c]',
  tight: 'border-l-[#6b6b7a]',
  at_risk: 'border-l-[#e87040]',
  blocked: 'border-l-[#e87040]',
  overdue: 'border-l-[#ff3b3b]',
};

const PHASE_STYLES: Record<string, { bg: string; text: string }> = {
  diagnosis: { bg: 'bg-blue-500/15', text: 'text-blue-400' },
  scoped: { bg: 'bg-white/10', text: 'text-white/50' },
  active: { bg: 'bg-[#c8a45c]/15', text: 'text-[#c8a45c]' },
  hold: { bg: 'bg-[#e87040]/15', text: 'text-[#e87040]' },
  qc: { bg: 'bg-[#c8a45c]/15', text: 'text-[#c8a45c]' },
  complete: { bg: 'bg-green-500/15', text: 'text-green-400' },
};

function phaseLabel(phase: string): string {
  const map: Record<string, string> = {
    diagnosis: 'Diagnosis',
    scoped: 'Scoped',
    active: 'Active',
    hold: 'Parts hold',
    qc: 'QC',
    complete: 'Done',
  };
  return map[phase] || phase;
}

function timeLabel(sr: TechLane['jobs'][0]): { text: string; color: string } {
  if (sr.health_status === 'overdue') return { text: 'Overdue', color: 'text-[#ff3b3b]' };

  const dominantPhase = sr.lines_in_diagnosis > 0
    ? 'diagnosis'
    : sr.lines_on_hold > 0 && sr.lines_active === 0
      ? 'hold'
      : sr.lines_active > 0
        ? 'active'
        : sr.lines_complete === sr.total_lines
          ? 'complete'
          : 'scoped';

  if (dominantPhase === 'diagnosis') return { text: '—', color: 'text-blue-400' };
  if (dominantPhase === 'complete') return { text: 'Done', color: 'text-[#c8a45c]' };
  if (dominantPhase === 'hold') {
    const eta = sr.max_parts_eta_days;
    return { text: eta ? `ETA ${eta}d` : 'Hold', color: 'text-[#e87040]' };
  }

  const rem = sr.remaining_hours;
  if (rem <= 0) return { text: 'Done', color: 'text-[#c8a45c]' };
  return { text: `${rem.toFixed(1)}h left`, color: `text-[${STATUS_COLORS[sr.health_status]}]` };
}

function vehicleLabel(job: TechLane['jobs'][0]): string {
  const v = job.vehicle;
  if (v?.year) return `${v.year} ${v.make} ${v.model}`;
  return job.title;
}

export default function HealthBoardPage() {
  const [data, setData] = useState<HealthBoardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/health-board');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center">
        <div className="text-center">
          <Gauge className="w-12 h-12 text-[#c8a45c] mx-auto mb-4 animate-pulse" />
          <p className="text-white/50 text-lg">Loading health board...</p>
        </div>
      </div>
    );
  }

  const { pulse, lanes, timeline } = data;

  return (
    <div className="min-h-screen bg-[#0d0d14] p-5 flex flex-col gap-4 overflow-hidden">
      {/* Pulse Row */}
      <div className="flex gap-3 items-stretch">
        <div className="flex items-center gap-2 px-3 shrink-0">
          <span className="text-[#c8a45c] font-semibold text-lg tracking-wide">KSB</span>
        </div>

        <PulseCard
          label="On-time delivery"
          value={`${pulse.on_time_pct}%`}
          valueColor="text-[#c8a45c]"
          sub={pulse.on_time_trend >= 0 ? `↑ ${pulse.on_time_trend}% this week` : `↓ ${Math.abs(pulse.on_time_trend)}% this week`}
          subColor={pulse.on_time_trend >= 0 ? 'text-green-400' : 'text-[#ff3b3b]'}
        />
        <PulseCard
          label="Vehicles active"
          value={String(pulse.vehicles_active)}
          valueColor="text-white"
          sub={`across ${pulse.bay_count} bays`}
        />
        <PulseCard
          label="At risk"
          value={String(pulse.at_risk_count)}
          valueColor={pulse.at_risk_count > 0 ? 'text-[#e87040]' : 'text-[#c8a45c]'}
          sub={pulse.at_risk_reasons || 'All clear'}
        />
        <PulseCard
          label="Aging (5+ days)"
          value={String(pulse.aging_count)}
          valueColor={pulse.aging_count > 0 ? 'text-[#ff3b3b]' : 'text-[#c8a45c]'}
          sub={pulse.aging_detail || 'None'}
        />
        <PulseCard
          label="Comebacks (30d)"
          value={String(pulse.comeback_count_30d)}
          valueColor="text-[#c8a45c]"
          sub={pulse.comeback_count_30d === 0 ? `Clean streak: ${pulse.comeback_streak_days} days` : `${pulse.comeback_count_30d} in last 30 days`}
          subColor={pulse.comeback_count_30d === 0 ? 'text-green-400' : 'text-[#ff3b3b]'}
        />
      </div>

      <div className="h-px bg-[#1e1e2e]" />

      {/* Tech Lanes */}
      <div className="flex-1 flex flex-col gap-2 min-h-0 overflow-auto">
        {lanes.map((lane, i) => (
          <div key={lane.tech.id}>
            <div className="flex items-start gap-3 min-h-[68px]">
              <div className="w-[100px] shrink-0 pt-2">
                <div className="text-sm font-medium text-white">{lane.tech.full_name}</div>
                <div className="text-[10px] text-[#6b6b7a]">
                  {lane.tech.default_role === 'shop_admin' ? 'Lead tech' : 'Technician'}
                </div>
                {lane.capacity && !lane.capacity.is_available_today && (
                  <div className="text-[9px] text-[#ff3b3b] mt-1">OUT</div>
                )}
              </div>

              <div className="flex gap-2 flex-1 overflow-x-auto pb-1">
                {lane.jobs.length === 0 && (
                  <div className="text-xs text-[#6b6b7a] pt-3 italic">No active jobs</div>
                )}
                {lane.jobs.map((job) => {
                  const time = timeLabel(job);
                  const dominantPhase = job.lines_in_diagnosis > 0
                    ? 'diagnosis'
                    : job.lines_on_hold > 0 && job.lines_active === 0
                      ? 'hold'
                      : job.lines_active > 0
                        ? 'active'
                        : job.lines_complete === job.total_lines
                          ? 'complete'
                          : 'scoped';
                  const ps = PHASE_STYLES[dominantPhase] || PHASE_STYLES.scoped;

                  return (
                    <div
                      key={job.id}
                      className={`bg-[#141420] rounded-lg p-2.5 px-3 min-w-[160px] max-w-[190px] shrink-0 border-l-[3px] ${STATUS_BORDER[job.health_status]}`}
                    >
                      <div className="text-xs font-medium text-white truncate">
                        {vehicleLabel(job)}
                      </div>
                      <div className="text-[10px] text-[#8888a0] truncate mt-0.5">
                        {job.title}
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className={`text-[9px] uppercase tracking-wide font-medium px-1.5 py-0.5 rounded ${ps.bg} ${ps.text}`}>
                          {phaseLabel(dominantPhase)}
                        </span>
                        <span className={`text-[10px] font-medium ${time.color}`}>
                          {time.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {i < lanes.length - 1 && <div className="h-px bg-[#1a1a24] mt-2" />}
          </div>
        ))}
      </div>

      <div className="h-px bg-[#1e1e2e]" />

      {/* Delivery Timeline */}
      <div className="bg-[#141420] rounded-lg p-3 px-4 border border-[#1e1e2e]">
        <TimelineView entries={timeline} />
      </div>

      {/* Footer */}
      {lastUpdated && (
        <div className="text-[10px] text-[#6b6b7a] text-right">
          Last updated: {lastUpdated.toLocaleTimeString()} · Auto-refresh 30s
        </div>
      )}
    </div>
  );
}

function PulseCard({
  label,
  value,
  valueColor,
  sub,
  subColor,
}: {
  label: string;
  value: string;
  valueColor: string;
  sub: string;
  subColor?: string;
}) {
  return (
    <div className="flex-1 bg-[#141420] rounded-lg px-3.5 py-2.5 border border-[#1e1e2e] min-w-0">
      <div className="text-[10px] text-[#6b6b7a] uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-3xl font-medium leading-tight ${valueColor}`}>{value}</div>
      <div className={`text-[10px] mt-0.5 ${subColor || 'text-[#6b6b7a]'} truncate`}>{sub}</div>
    </div>
  );
}

function TimelineView({ entries }: { entries: TimelineEntry[] }) {
  const now = new Date();
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    days.push(
      i === 0
        ? 'Today'
        : d.toLocaleDateString('en-US', { weekday: 'short' })
    );
  }

  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const rangeMs = 7 * 24 * 60 * 60 * 1000;

  function positionPct(date: Date): number {
    const offset = date.getTime() - dayStart.getTime();
    return Math.max(0, Math.min(100, (offset / rangeMs) * 100));
  }

  const sorted = [...entries]
    .filter((e) => e.promised_at)
    .sort((a, b) => new Date(a.promised_at!).getTime() - new Date(b.promised_at!).getTime())
    .slice(0, 8);

  return (
    <>
      <div className="flex mb-2.5">
        {days.map((d, i) => (
          <div
            key={d}
            className={`flex-1 text-center text-[10px] uppercase tracking-wider ${
              i === 0 ? 'text-[#c8a45c] font-medium' : 'text-[#6b6b7a]'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {sorted.map((entry) => {
        const promiseDate = new Date(entry.promised_at!);
        const promisePct = positionPct(promiseDate);
        const progressPct = entry.total_labor_hours > 0
          ? (entry.completed_labor_hours / entry.total_labor_hours) * promisePct
          : 0;
        const isOverdue = entry.health_status === 'overdue';
        const markerColor = isOverdue ? '#ff3b3b' : '#c8a45c';
        const labelColor = isOverdue ? 'text-[#ff3b3b]' : entry.health_status === 'blocked' ? 'text-[#e87040]' : 'text-[#8888a0]';

        return (
          <div key={entry.id} className="flex items-center gap-2 mb-1.5">
            <div className={`text-[10px] w-[100px] shrink-0 truncate ${labelColor}`}>
              {entry.vehicle_label}
            </div>
            <div className="flex-1 h-4 relative">
              {/* Grid lines */}
              <div className="absolute inset-0 flex">
                {days.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-[#1e1e2e] last:border-r-0" />
                ))}
              </div>

              {/* Completed work */}
              {progressPct > 0 && (
                <div
                  className="absolute top-0 h-full rounded-sm bg-[#c8a45c]/25"
                  style={{ left: 0, width: `${progressPct}%` }}
                />
              )}

              {/* Parts hold segment */}
              {entry.parts_hold && entry.max_parts_eta_days && (
                <div
                  className="absolute top-0 h-full rounded-sm border border-dashed border-[#e87040]/60 bg-[#e87040]/20"
                  style={{
                    left: `${progressPct}%`,
                    width: `${Math.min(30, (entry.max_parts_eta_days / 7) * 100)}%`,
                  }}
                />
              )}

              {/* Remaining work */}
              {!entry.parts_hold && progressPct < promisePct && (
                <div
                  className="absolute top-0 h-full rounded-sm bg-[#c8a45c]/40"
                  style={{
                    left: `${progressPct}%`,
                    width: `${promisePct - progressPct}%`,
                  }}
                />
              )}

              {/* Promise date marker */}
              <div
                className="absolute top-[-1px] w-[2px] h-[18px] rounded-sm"
                style={{ left: `${promisePct}%`, backgroundColor: markerColor }}
              />
            </div>
          </div>
        );
      })}

      {sorted.length === 0 && (
        <div className="text-xs text-[#6b6b7a] text-center py-3 italic">
          No jobs with delivery dates set
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 justify-end mt-2.5">
        <LegendItem color="bg-[#c8a45c]/40" label="Active work" />
        <LegendItem color="bg-[#c8a45c]/25" label="Completed" />
        <LegendItem color="bg-[#e87040]/20 border border-dashed border-[#e87040]/60" label="Parts hold" />
        <LegendItem color="bg-[#c8a45c] w-[3px]" label="Promise date" swatch />
      </div>
    </>
  );
}

function LegendItem({
  color,
  label,
  swatch,
}: {
  color: string;
  label: string;
  swatch?: boolean;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={`${swatch ? 'w-[3px] h-2 rounded-sm' : 'w-3 h-2 rounded-sm'} ${color}`}
      />
      <span className="text-[9px] text-[#6b6b7a]">{label}</span>
    </div>
  );
}
