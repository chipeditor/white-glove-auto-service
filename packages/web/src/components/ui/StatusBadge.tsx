import { clsx } from 'clsx';
import type { VehicleStatus, ServiceRequestStatus, InspectionStatus } from '@/shared/types';
import { VEHICLE_STATUS_LABELS } from '@/shared/constants';

type Status = VehicleStatus | ServiceRequestStatus | InspectionStatus;

const STATUS_STYLES: Record<string, string> = {
  intake_started: 'bg-blue-500/15 text-blue-400',
  intake_completed: 'bg-cyan-500/15 text-cyan-400',
  in_service: 'bg-green-500/15 text-green-400',
  in_progress: 'bg-green-500/15 text-green-400',
  awaiting_approval: 'bg-amber-500/15 text-amber-400',
  awaiting_customer_approval: 'bg-amber-500/15 text-amber-400',
  ready_for_delivery: 'bg-emerald-500/15 text-emerald-400',
  delivered: 'bg-slate-500/15 text-slate-400',
  completed: 'bg-slate-500/15 text-slate-400',
  archived: 'bg-gray-500/15 text-gray-400',
  draft: 'bg-gray-500/15 text-gray-400',
  submitted: 'bg-blue-500/15 text-blue-400',
  approved: 'bg-green-500/15 text-green-400',
  declined: 'bg-red-500/15 text-red-400',
  quality_control: 'bg-purple-500/15 text-purple-400',
  not_started: 'bg-gray-500/15 text-gray-400',
  needs_attention: 'bg-red-500/15 text-red-400',
  signed_off: 'bg-emerald-500/15 text-emerald-400',
};

const STATUS_LABELS: Record<string, string> = {
  ...VEHICLE_STATUS_LABELS,
  in_progress: 'In Progress',
  awaiting_customer_approval: 'Awaiting Approval',
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  declined: 'Declined',
  quality_control: 'Quality Control',
  completed: 'Completed',
  not_started: 'Not Started',
  needs_attention: 'Needs Attention',
  signed_off: 'Signed Off',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium',
        STATUS_STYLES[status] ?? 'bg-gray-500/15 text-gray-400',
        className
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}
