'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Car, ChevronRight, Loader2 } from 'lucide-react';
import type { ServiceRequest, ServiceRequestStatus, Vehicle, Customer } from '@/shared/types';

interface JobWithDetails extends ServiceRequest {
  vehicle: Vehicle;
  customer: Customer | null;
}

interface MyWorkViewProps {
  jobs: JobWithDetails[];
}

const STATUS_FLOW: ServiceRequestStatus[] = [
  'approved',
  'in_progress',
  'quality_control',
  'ready_for_delivery',
  'completed',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved',
  in_progress: 'In Progress',
  quality_control: 'Quality Control',
  ready_for_delivery: 'Ready for Delivery',
  completed: 'Completed',
};

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-500/10 text-green-400 border-green-500/20',
  in_progress: 'bg-wg-blue/10 text-wg-blue border-wg-blue/20',
  quality_control: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ready_for_delivery: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const GROUP_ORDER: ServiceRequestStatus[] = [
  'in_progress',
  'approved',
  'quality_control',
  'ready_for_delivery',
  'submitted',
  'awaiting_customer_approval',
  'draft',
];

function getNextStatus(current: ServiceRequestStatus): ServiceRequestStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function JobCard({ job }: { job: JobWithDetails }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updating, setUpdating] = useState(false);
  const nextStatus = getNextStatus(job.status);

  async function handleAdvance() {
    if (!nextStatus || updating) return;
    setUpdating(true);

    const res = await fetch(`/api/service-requests/${job.id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (res.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
    setUpdating(false);
  }

  const isLoading = isPending || updating;

  return (
    <div className="bg-wg-card rounded-xl border border-wg-border p-4 hover:bg-wg-card-hover transition-colors">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/service-requests/${job.id}`} className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Car size={14} className="text-wg-text2 shrink-0" />
            <span className="text-xs text-wg-muted truncate">
              {job.vehicle.year} {job.vehicle.make} {job.vehicle.model}
            </span>
          </div>
          <h4 className="text-sm font-medium text-wg-text truncate">{job.title}</h4>
          {job.customer && (
            <p className="text-xs text-wg-muted mt-1">{job.customer.full_name}</p>
          )}
        </Link>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[job.status] ?? 'bg-wg-bg2 text-wg-muted border-wg-border'}`}>
            {STATUS_LABELS[job.status] ?? job.status}
          </span>
          {job.promised_at && (
            <p className="text-[10px] text-wg-muted mt-1">
              Promise: {formatDate(job.promised_at)}
            </p>
          )}
        </div>
      </div>
      {nextStatus && (
        <button
          onClick={handleAdvance}
          disabled={isLoading}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-wg-blue/10 text-wg-blue text-sm font-medium hover:bg-wg-blue/20 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <>
              Move to {STATUS_LABELS[nextStatus]}
              <ChevronRight size={14} />
            </>
          )}
        </button>
      )}
    </div>
  );
}

export function MyWorkView({ jobs }: MyWorkViewProps) {
  if (jobs.length === 0) {
    return (
      <div className="bg-wg-card rounded-xl border border-wg-border p-12 text-center">
        <p className="text-sm text-wg-muted">No jobs currently assigned to you.</p>
      </div>
    );
  }

  const grouped = GROUP_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status] ?? status,
    items: jobs.filter((j) => j.status === status),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <div key={group.status}>
          <h3 className="text-sm font-medium text-wg-text mb-3">
            {group.label}{' '}
            <span className="text-wg-muted">({group.items.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {group.items.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
