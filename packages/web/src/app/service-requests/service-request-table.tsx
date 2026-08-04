'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, Clock, DollarSign } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { ServiceRequestWithVehicle, ServiceRequestStatus } from '@/shared/types';

const STATUS_FILTERS: { label: string; value: ServiceRequestStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: 'draft' },
  { label: 'Submitted', value: 'submitted' },
  { label: 'Awaiting Approval', value: 'awaiting_customer_approval' },
  { label: 'Approved', value: 'approved' },
  { label: 'In Progress', value: 'in_progress' },
  { label: 'QC', value: 'quality_control' },
  { label: 'Ready', value: 'ready_for_delivery' },
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

interface Props {
  serviceRequests: ServiceRequestWithVehicle[];
}

export function ServiceRequestTable({ serviceRequests }: Props) {
  const [filter, setFilter] = useState<ServiceRequestStatus | 'all'>('all');

  const filtered = filter === 'all'
    ? serviceRequests
    : serviceRequests.filter((sr) => sr.status === filter);

  const statusCounts = serviceRequests.reduce<Record<string, number>>((acc, sr) => {
    acc[sr.status] = (acc[sr.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? serviceRequests.length : (statusCounts[f.value] || 0);
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
                <span className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-wg-border">
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Request</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Vehicle</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Customer</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Total</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Status</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider w-16 text-right">Updated</span>
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-wg-muted">
            No service requests found.
          </div>
        ) : (
          filtered.map((sr) => (
            <Link
              key={sr.id}
              href={`/service-requests/${sr.id}`}
              className="grid grid-cols-[1fr_1fr_auto_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-wg-card-hover transition-colors border-b border-wg-border last:border-b-0"
            >
              <div>
                <span className="text-sm font-medium text-wg-text">{sr.title}</span>
                {sr.description && (
                  <p className="text-xs text-wg-muted truncate max-w-[240px]">{sr.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-wg-bg2 flex items-center justify-center">
                  <Car size={14} className="text-wg-text2" />
                </div>
                <span className="text-sm text-wg-text2">
                  {sr.vehicle ? `${sr.vehicle.year ?? ''} ${sr.vehicle.make} ${sr.vehicle.model}`.trim() : '—'}
                </span>
              </div>
              <span className="text-sm text-wg-text2 min-w-[100px]">
                {sr.customer?.full_name ?? '—'}
              </span>
              <span className="text-sm text-wg-text font-medium min-w-[80px] text-right">
                {sr.total ? formatCurrency(sr.total) : '—'}
              </span>
              <StatusBadge status={sr.status} />
              <span className="text-xs text-wg-muted w-16 text-right">
                {timeAgo(sr.updated_at)}
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
