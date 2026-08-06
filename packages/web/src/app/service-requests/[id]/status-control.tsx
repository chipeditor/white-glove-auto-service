'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2 } from 'lucide-react';
import type { ServiceRequestStatus } from '@/shared/types';

const STATUS_FLOW: ServiceRequestStatus[] = [
  'draft',
  'submitted',
  'awaiting_customer_approval',
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

function getNextStatus(current: ServiceRequestStatus): ServiceRequestStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

interface Props {
  serviceRequestId: string;
  currentStatus: ServiceRequestStatus;
}

export function StatusControl({ serviceRequestId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextStatus = getNextStatus(currentStatus);
  if (!nextStatus || currentStatus === 'declined') return null;

  async function handleAdvance() {
    if (!nextStatus || updating) return;
    setUpdating(true);
    setError(null);

    try {
      const res = await fetch(`/api/service-requests/${serviceRequestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Could not update status.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setUpdating(false);
    }
  }

  const isLoading = isPending || updating;

  return (
    <div>
      <button
        onClick={handleAdvance}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-wg-blue/10 text-wg-blue text-sm font-medium hover:bg-wg-blue/20 transition-colors disabled:opacity-50"
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
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
