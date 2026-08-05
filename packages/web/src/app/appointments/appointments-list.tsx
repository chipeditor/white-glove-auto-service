'use client';

import { useState } from 'react';
import { CalendarCheck, Clock, User, Phone, Mail, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Appointment {
  id: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service_type: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  confirmed: { label: 'Confirmed', color: 'text-wg-green', bg: 'bg-wg-green/10' },
  checked_in: { label: 'Checked In', color: 'text-wg-gold', bg: 'bg-wg-gold/10' },
  in_progress: { label: 'In Progress', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-400/10' },
  cancelled: { label: 'Cancelled', color: 'text-red-400', bg: 'bg-red-400/10' },
  no_show: { label: 'No Show', color: 'text-wg-muted', bg: 'bg-wg-bg2' },
};

const STATUS_ACTIONS: Record<string, string[]> = {
  scheduled: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled', 'no_show'],
  checked_in: ['in_progress', 'cancelled'],
  in_progress: ['completed'],
};

function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return dateStr === `${y}-${m}-${d}`;
}

function isPast(dateStr: string): boolean {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return dateStr < `${y}-${m}-${d}`;
}

type FilterTab = 'upcoming' | 'today' | 'past' | 'all';

export function AppointmentsList({ appointments: initialAppointments, orgId }: { appointments: Appointment[]; orgId: string }) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [filter, setFilter] = useState<FilterTab>('upcoming');
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    const supabase = createClient();
    const { error } = await supabase
      .from('appointments')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
    setUpdating(null);
  }

  const filtered = appointments.filter(a => {
    if (filter === 'today') return isToday(a.scheduled_date);
    if (filter === 'upcoming') return !isPast(a.scheduled_date) && !['cancelled', 'no_show', 'completed'].includes(a.status);
    if (filter === 'past') return isPast(a.scheduled_date) || ['completed', 'cancelled', 'no_show'].includes(a.status);
    return true;
  });

  const todayCount = appointments.filter(a => isToday(a.scheduled_date) && !['cancelled', 'no_show', 'completed'].includes(a.status)).length;

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'today', label: 'Today', count: todayCount },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
  ];

  return (
    <div className="mt-6">
      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-wg-blue/10 text-wg-blue'
                : 'text-wg-text2 hover:bg-wg-card border border-wg-border'
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-wg-blue/20 text-wg-blue">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Appointments list */}
      {filtered.length === 0 ? (
        <div className="bg-wg-card rounded-xl border border-wg-border p-12 text-center">
          <CalendarCheck size={32} className="text-wg-muted mx-auto mb-3" />
          <p className="text-sm text-wg-muted">No appointments found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(appt => {
            const statusCfg = STATUS_CONFIG[appt.status] ?? STATUS_CONFIG.scheduled;
            const actions = STATUS_ACTIONS[appt.status] ?? [];
            const today = isToday(appt.scheduled_date);

            return (
              <div
                key={appt.id}
                className={`bg-wg-card rounded-xl border p-4 ${
                  today ? 'border-wg-gold/30' : 'border-wg-border'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Date & Time */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-wg-text">
                        <CalendarCheck size={14} className="text-wg-text2" />
                        <span>{formatDate(appt.scheduled_date)}</span>
                        {today && <span className="text-[10px] px-1.5 py-0.5 rounded bg-wg-gold/10 text-wg-gold font-bold">TODAY</span>}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-wg-text2">
                        <Clock size={12} />
                        {formatTime(appt.scheduled_time)}
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statusCfg.color} ${statusCfg.bg}`}>
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Service type */}
                    <p className="text-sm font-medium text-wg-text mb-1">{appt.service_type}</p>
                    {appt.description && <p className="text-xs text-wg-muted mb-2">{appt.description}</p>}

                    {/* Customer info */}
                    <div className="flex items-center gap-4 text-xs text-wg-text2">
                      <span className="flex items-center gap-1">
                        <User size={12} className="text-wg-muted" />
                        {appt.customer_name}
                      </span>
                      {appt.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} className="text-wg-muted" />
                          {appt.customer_phone}
                        </span>
                      )}
                      {appt.customer_email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-wg-muted" />
                          {appt.customer_email}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {actions.length > 0 && (
                    <div className="flex gap-1.5 ml-4 shrink-0">
                      {actions.map(action => {
                        const cfg = STATUS_CONFIG[action];
                        const icon = action === 'cancelled' ? XCircle
                          : action === 'no_show' ? AlertCircle
                          : CheckCircle2;
                        const Icon = icon;
                        return (
                          <button
                            key={action}
                            onClick={() => updateStatus(appt.id, action)}
                            disabled={updating === appt.id}
                            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors border border-wg-border hover:bg-wg-bg2 disabled:opacity-50 ${cfg.color}`}
                            title={cfg.label}
                          >
                            <Icon size={12} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
