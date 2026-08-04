'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  draft: 'border-l-gray-500',
  submitted: 'border-l-blue-400',
  awaiting_customer_approval: 'border-l-amber-400',
  approved: 'border-l-green-400',
  in_progress: 'border-l-blue-500',
  quality_control: 'border-l-purple-400',
  ready_for_delivery: 'border-l-emerald-400',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved',
  in_progress: 'In Progress',
  quality_control: 'QC',
  ready_for_delivery: 'Ready',
};

interface ServiceRequest {
  id: string;
  title: string;
  status: string;
  estimated_completion: string | null;
  created_at: string;
  technician_id: string | null;
  vehicle: { year: number | null; make: string; model: string } | null;
  technician: { id: string; full_name: string } | null;
  customer: { full_name: string } | null;
}

interface Props {
  serviceRequests: ServiceRequest[];
  technicians: { id: string; full_name: string }[];
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function ScheduleCalendar({ serviceRequests, technicians }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [view, setView] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const filtered = useMemo(() => {
    let srs = serviceRequests;
    if (selectedTech) {
      srs = srs.filter((sr) => sr.technician_id === selectedTech);
    }
    return srs;
  }, [serviceRequests, selectedTech]);

  function getSrsForDay(day: Date) {
    return filtered.filter((sr) => {
      const date = sr.estimated_completion ? new Date(sr.estimated_completion) : null;
      if (!date) return false;
      return isSameDay(date, day);
    });
  }

  const unscheduled = filtered.filter((sr) => !sr.estimated_completion);

  function prevWeek() {
    setWeekStart(addDays(weekStart, -7));
  }

  function nextWeek() {
    setWeekStart(addDays(weekStart, 7));
  }

  function goToday() {
    setWeekStart(getWeekStart(new Date()));
    setSelectedDay(new Date());
  }

  const weekLabel = `${formatDate(weekDays[0])} — ${formatDate(weekDays[6])}`;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-semibold text-wg-text">Schedule</h1>
          <p className="mt-1 text-sm text-wg-text2">Service requests by estimated completion</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedTech ?? ''}
            onChange={(e) => setSelectedTech(e.target.value || null)}
            className="px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text"
          >
            <option value="">All Technicians</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
          <div className="flex border border-wg-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={`px-3 py-2 text-sm ${view === 'week' ? 'bg-wg-blue text-white' : 'bg-wg-card text-wg-text2 hover:text-wg-text'}`}
            >
              Week
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-3 py-2 text-sm ${view === 'day' ? 'bg-wg-blue text-white' : 'bg-wg-card text-wg-text2 hover:text-wg-text'}`}
            >
              Day
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={prevWeek} className="p-1.5 rounded hover:bg-wg-card text-wg-text2 hover:text-wg-text">
          <ChevronLeft size={20} />
        </button>
        <button onClick={goToday} className="px-3 py-1 rounded-lg border border-wg-border text-sm text-wg-text2 hover:text-wg-text hover:bg-wg-card">
          Today
        </button>
        <button onClick={nextWeek} className="p-1.5 rounded hover:bg-wg-card text-wg-text2 hover:text-wg-text">
          <ChevronRight size={20} />
        </button>
        <span className="text-sm font-medium text-wg-text">{weekLabel}</span>
      </div>

      {view === 'week' ? (
        /* Week View */
        <div className="grid grid-cols-7 gap-px bg-wg-border rounded-xl overflow-hidden">
          {weekDays.map((day, i) => {
            const daySrs = getSrsForDay(day);
            const isToday = isSameDay(day, today);
            return (
              <div
                key={i}
                className="bg-wg-bg min-h-[200px] flex flex-col"
              >
                <div className={`px-3 py-2 text-center border-b border-wg-border ${isToday ? 'bg-wg-blue/10' : 'bg-wg-card'}`}>
                  <div className="text-xs text-wg-muted">{DAY_NAMES[i]}</div>
                  <div className={`text-sm font-medium ${isToday ? 'text-wg-blue' : 'text-wg-text'}`}>
                    {day.getDate()}
                  </div>
                </div>
                <div className="flex-1 p-1.5 space-y-1">
                  {daySrs.map((sr) => (
                    <Link
                      key={sr.id}
                      href={`/service-requests/${sr.id}`}
                      className={`block p-2 rounded-lg bg-wg-card hover:bg-wg-cardHover border-l-[3px] ${STATUS_COLORS[sr.status] ?? 'border-l-gray-500'} transition-colors`}
                    >
                      <p className="text-xs font-medium text-wg-text truncate">{sr.title}</p>
                      {sr.vehicle && (
                        <p className="text-[10px] text-wg-muted truncate mt-0.5">
                          {`${sr.vehicle.year ?? ''} ${sr.vehicle.make} ${sr.vehicle.model}`.trim()}
                        </p>
                      )}
                      {sr.technician && (
                        <p className="text-[10px] text-wg-text2 mt-0.5">{sr.technician.full_name}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Day View */
        <div className="bg-wg-card border border-wg-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-wg-border bg-wg-bg2">
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedDay(addDays(selectedDay, -1))} className="p-1 rounded hover:bg-wg-card text-wg-text2">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-wg-text">
                {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
              <button onClick={() => setSelectedDay(addDays(selectedDay, 1))} className="p-1 rounded hover:bg-wg-card text-wg-text2">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="p-4 space-y-2">
            {getSrsForDay(selectedDay).length === 0 ? (
              <p className="text-sm text-wg-muted py-8 text-center">No service requests scheduled for this day</p>
            ) : (
              getSrsForDay(selectedDay).map((sr) => (
                <Link
                  key={sr.id}
                  href={`/service-requests/${sr.id}`}
                  className={`flex items-center gap-4 p-3 rounded-lg bg-wg-bg hover:bg-wg-bg2 border-l-[3px] ${STATUS_COLORS[sr.status] ?? 'border-l-gray-500'} transition-colors`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wg-text">{sr.title}</p>
                    {sr.vehicle && (
                      <p className="text-xs text-wg-muted mt-0.5">
                        {`${sr.vehicle.year ?? ''} ${sr.vehicle.make} ${sr.vehicle.model}`.trim()}
                        {sr.customer ? ` — ${sr.customer.full_name}` : ''}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {sr.technician && <p className="text-xs text-wg-text2">{sr.technician.full_name}</p>}
                    <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                      sr.status === 'in_progress' ? 'bg-wg-blue/20 text-wg-blue' :
                      sr.status === 'approved' ? 'bg-wg-green/20 text-wg-green' :
                      'bg-wg-amber/20 text-wg-amber'
                    }`}>
                      {STATUS_LABELS[sr.status] ?? sr.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-wg-muted mb-3">
            <Filter size={14} className="inline mr-1.5" />
            Unscheduled ({unscheduled.length})
          </h3>
          <div className="bg-wg-card border border-wg-border rounded-xl divide-y divide-wg-border/50">
            {unscheduled.map((sr) => (
              <Link
                key={sr.id}
                href={`/service-requests/${sr.id}`}
                className="flex items-center gap-4 p-3 hover:bg-wg-bg2 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-wg-text">{sr.title}</p>
                  {sr.vehicle && (
                    <p className="text-xs text-wg-muted">
                      {`${sr.vehicle.year ?? ''} ${sr.vehicle.make} ${sr.vehicle.model}`.trim()}
                    </p>
                  )}
                </div>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  sr.status === 'in_progress' ? 'bg-wg-blue/20 text-wg-blue' :
                  'bg-wg-amber/20 text-wg-amber'
                }`}>
                  {STATUS_LABELS[sr.status] ?? sr.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
