'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { InspectionType, InspectionStatus } from '@/shared/types';
import type { InspectionWithDetails } from '@/lib/queries';

const TYPE_FILTERS: { label: string; value: InspectionType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Intake', value: 'intake' },
  { label: 'Mechanical', value: 'mechanical' },
  { label: 'Cosmetic', value: 'cosmetic' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'QC', value: 'quality_control' },
  { label: 'Spot Check', value: 'spot_check' },
];

const STATUS_FILTERS: { label: string; value: InspectionStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Not Started', value: 'not_started' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Needs Attention', value: 'needs_attention' },
  { label: 'Signed Off', value: 'signed_off' },
];

const TYPE_LABELS: Record<InspectionType, string> = {
  intake: 'Intake',
  mechanical: 'Mechanical',
  cosmetic: 'Cosmetic',
  delivery: 'Delivery',
  quality_control: 'QC',
  spot_check: 'Spot Check',
};

const TYPE_STYLES: Record<InspectionType, string> = {
  intake: 'bg-blue-500/15 text-blue-400',
  mechanical: 'bg-orange-500/15 text-orange-400',
  cosmetic: 'bg-pink-500/15 text-pink-400',
  delivery: 'bg-emerald-500/15 text-emerald-400',
  quality_control: 'bg-purple-500/15 text-purple-400',
  spot_check: 'bg-amber-500/15 text-amber-400',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface Props {
  inspections: InspectionWithDetails[];
}

export function InspectionsTable({ inspections }: Props) {
  const [typeFilter, setTypeFilter] = useState<InspectionType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<InspectionStatus | 'all'>('all');

  const filtered = inspections.filter((ins) => {
    if (typeFilter !== 'all' && ins.type !== typeFilter) return false;
    if (statusFilter !== 'all' && ins.status !== statusFilter) return false;
    return true;
  });

  const typeCounts = inspections.reduce<Record<string, number>>((acc, ins) => {
    acc[ins.type] = (acc[ins.type] || 0) + 1;
    return acc;
  }, {});

  const statusCounts = inspections.reduce<Record<string, number>>((acc, ins) => {
    acc[ins.status] = (acc[ins.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-3">
        <span className="text-xs font-medium text-wg-muted uppercase tracking-wider mb-1.5 block">Type</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {TYPE_FILTERS.map((f) => {
            const count = f.value === 'all' ? inspections.length : (typeCounts[f.value] || 0);
            const active = typeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setTypeFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-wg-blue/15 text-wg-blue'
                    : 'bg-wg-card text-wg-text2 hover:text-wg-text hover:bg-wg-card-hover'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4">
        <span className="text-xs font-medium text-wg-muted uppercase tracking-wider mb-1.5 block">Status</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((f) => {
            const count = f.value === 'all' ? inspections.length : (statusCounts[f.value] || 0);
            const active = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-wg-blue/15 text-wg-blue'
                    : 'bg-wg-card text-wg-text2 hover:text-wg-text hover:bg-wg-card-hover'
                }`}
              >
                {f.label}
                {count > 0 && (
                  <span className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 px-4 py-3 border-b border-wg-border">
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Type</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Vehicle</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Service Request</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Status</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider w-16 text-right">Date</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-wg-muted">
            No inspections found.
          </div>
        ) : (
          filtered.map((ins) => (
            <Link
              key={ins.id}
              href={`/inspection/${ins.id}`}
              className="grid grid-cols-[auto_1fr_1fr_auto_auto] items-center gap-4 px-4 py-3 hover:bg-wg-card-hover transition-colors border-b border-wg-border last:border-b-0"
            >
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${TYPE_STYLES[ins.type]}`}
              >
                {TYPE_LABELS[ins.type]}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-wg-bg2 flex items-center justify-center">
                  <ClipboardCheck size={14} className="text-wg-text2" />
                </div>
                <span className="text-sm text-wg-text2">
                  {ins.vehicle
                    ? `${ins.vehicle.year ?? ''} ${ins.vehicle.make} ${ins.vehicle.model}`.trim()
                    : '—'}
                </span>
              </div>
              <span className="text-sm text-wg-text2 truncate">
                {ins.service_request?.title ?? '—'}
              </span>
              <StatusBadge status={ins.status} />
              <span className="text-xs text-wg-muted w-16 text-right">
                {timeAgo(ins.created_at)}
              </span>
            </Link>
          ))
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-wg-card rounded-xl border border-wg-border px-4 py-12 text-center text-sm text-wg-muted">
            No inspections found.
          </div>
        ) : (
          filtered.map((ins) => (
            <Link
              key={ins.id}
              href={`/inspection/${ins.id}`}
              className="block bg-wg-card rounded-xl border border-wg-border p-3.5 active:bg-wg-card-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-wg-text truncate">
                    {ins.vehicle
                      ? `${ins.vehicle.year ?? ''} ${ins.vehicle.make} ${ins.vehicle.model}`.trim()
                      : 'Unknown Vehicle'}
                  </p>
                  <p className="text-xs text-wg-muted truncate mt-0.5">
                    {ins.service_request?.title ?? '—'}
                  </p>
                </div>
                <StatusBadge status={ins.status} />
              </div>
              <div className="flex items-center gap-2 text-xs text-wg-muted">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${TYPE_STYLES[ins.type]}`}>
                  {TYPE_LABELS[ins.type]}
                </span>
                <span className="ml-auto">{timeAgo(ins.created_at)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
