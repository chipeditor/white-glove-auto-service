'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, CheckSquare, Search, User } from 'lucide-react';
import type { ChecklistWithDetails } from '@/shared/types';

type StatusFilter = 'all' | 'in_progress' | 'completed';

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getChecklistStatus(checklist: ChecklistWithDetails): StatusFilter {
  if (checklist.total_items > 0 && checklist.completed_items >= checklist.total_items) {
    return 'completed';
  }
  return 'in_progress';
}

function progressPercent(checklist: ChecklistWithDetails): number {
  if (checklist.total_items === 0) return 0;
  return Math.round((checklist.completed_items / checklist.total_items) * 100);
}

interface Props {
  checklists: ChecklistWithDetails[];
}

export function ChecklistsTable({ checklists }: Props) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const statusCounts = checklists.reduce<Record<string, number>>((acc, cl) => {
    const s = getChecklistStatus(cl);
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filtered = checklists.filter((cl) => {
    if (filter !== 'all' && getChecklistStatus(cl) !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      const vehicleStr = cl.vehicle
        ? `${cl.vehicle.year ?? ''} ${cl.vehicle.make} ${cl.vehicle.model}`.toLowerCase()
        : '';
      const assignedStr = cl.assigned_user?.full_name?.toLowerCase() ?? '';
      return (
        cl.title.toLowerCase().includes(q) ||
        (cl.description ?? '').toLowerCase().includes(q) ||
        vehicleStr.includes(q) ||
        assignedStr.includes(q)
      );
    }
    return true;
  });

  return (
    <div>
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-wg-muted" />
          <input
            type="text"
            placeholder="Search checklists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:ring-1 focus:ring-wg-blue/50 focus:border-wg-blue/50"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            const count =
              f.value === 'all' ? checklists.length : (statusCounts[f.value] || 0);
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-wg-blue/15 text-wg-blue'
                    : 'bg-wg-card text-wg-text2 hover:text-wg-text hover:bg-wg-card-hover'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_minmax(120px,1fr)_auto] gap-4 px-4 py-3 border-b border-wg-border">
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Checklist
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Vehicle
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Assigned To
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Progress
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider w-16 text-right">
            Updated
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-wg-muted">
            No checklists found.
          </div>
        ) : (
          filtered.map((cl) => {
            const pct = progressPercent(cl);
            const isComplete = getChecklistStatus(cl) === 'completed';
            const href = cl.service_request_id
              ? `/service-requests/${cl.service_request_id}`
              : '#';

            return (
              <Link
                key={cl.id}
                href={href}
                className="grid grid-cols-[1fr_1fr_auto_minmax(120px,1fr)_auto] items-center gap-4 px-4 py-3 hover:bg-wg-card-hover transition-colors border-b border-wg-border last:border-b-0"
              >
                {/* Title + description */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CheckSquare
                      size={14}
                      className={isComplete ? 'text-emerald-400' : 'text-wg-text2'}
                    />
                    <span className="text-sm font-medium text-wg-text truncate">
                      {cl.title}
                    </span>
                  </div>
                  {cl.description && (
                    <p className="text-xs text-wg-muted truncate max-w-[240px] mt-0.5 ml-[22px]">
                      {cl.description}
                    </p>
                  )}
                  {cl.service_request && (
                    <p className="text-[11px] text-wg-muted truncate max-w-[240px] mt-0.5 ml-[22px]">
                      SR: {cl.service_request.title}
                    </p>
                  )}
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-wg-bg2 flex items-center justify-center flex-shrink-0">
                    <Car size={14} className="text-wg-text2" />
                  </div>
                  <span className="text-sm text-wg-text2 truncate">
                    {cl.vehicle
                      ? `${cl.vehicle.year ?? ''} ${cl.vehicle.make} ${cl.vehicle.model}`.trim()
                      : '—'}
                  </span>
                </div>

                {/* Assigned to */}
                <div className="flex items-center gap-2 min-w-[100px]">
                  <User size={12} className="text-wg-muted flex-shrink-0" />
                  <span className="text-sm text-wg-text2 truncate">
                    {cl.assigned_user?.full_name ?? '—'}
                  </span>
                </div>

                {/* Progress */}
                <div className="min-w-[120px]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-wg-text2">
                      {cl.completed_items}/{cl.total_items}
                    </span>
                    <span
                      className={`text-xs font-medium ${
                        isComplete ? 'text-emerald-400' : 'text-wg-muted'
                      }`}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-wg-bg2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isComplete ? 'bg-emerald-500' : 'bg-wg-blue'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Updated */}
                <span className="text-xs text-wg-muted w-16 text-right">
                  {timeAgo(cl.updated_at)}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
