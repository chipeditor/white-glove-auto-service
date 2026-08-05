import type { AuditAction } from '@/shared/types';

interface TimelineEvent {
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

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  created: { label: 'Created', color: 'text-blue-400', icon: 'bg-blue-500/20' },
  updated: { label: 'Updated', color: 'text-sky-400', icon: 'bg-sky-500/20' },
  deleted: { label: 'Deleted', color: 'text-red-400', icon: 'bg-red-500/20' },
  status_changed: { label: 'Status changed', color: 'text-amber-400', icon: 'bg-amber-500/20' },
  assigned: { label: 'Assigned', color: 'text-purple-400', icon: 'bg-purple-500/20' },
  signed: { label: 'Signed', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  uploaded: { label: 'Uploaded', color: 'text-cyan-400', icon: 'bg-cyan-500/20' },
  approved: { label: 'Approved', color: 'text-green-400', icon: 'bg-green-500/20' },
  declined: { label: 'Declined', color: 'text-red-400', icon: 'bg-red-500/20' },
  flagged: { label: 'Flagged', color: 'text-orange-400', icon: 'bg-orange-500/20' },
  vehicle_checked_in: { label: 'Vehicle checked in', color: 'text-blue-400', icon: 'bg-blue-500/20' },
  technician_assigned: { label: 'Technician assigned', color: 'text-purple-400', icon: 'bg-purple-500/20' },
  inspection_started: { label: 'Inspection started', color: 'text-cyan-400', icon: 'bg-cyan-500/20' },
  inspection_completed: { label: 'Inspection completed', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  estimate_created: { label: 'Estimate line added', color: 'text-sky-400', icon: 'bg-sky-500/20' },
  approval_sent: { label: 'Approval sent', color: 'text-amber-400', icon: 'bg-amber-500/20' },
  customer_approved: { label: 'Customer approved', color: 'text-green-400', icon: 'bg-green-500/20' },
  customer_declined: { label: 'Customer declined', color: 'text-red-400', icon: 'bg-red-500/20' },
  repair_started: { label: 'Repair started', color: 'text-blue-400', icon: 'bg-blue-500/20' },
  repair_completed: { label: 'Repair completed', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  parts_requested: { label: 'Parts requested', color: 'text-amber-400', icon: 'bg-amber-500/20' },
  parts_received: { label: 'Parts received', color: 'text-green-400', icon: 'bg-green-500/20' },
  qc_started: { label: 'QC started', color: 'text-purple-400', icon: 'bg-purple-500/20' },
  qc_passed: { label: 'QC passed', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  ready_for_pickup: { label: 'Ready for pickup', color: 'text-green-400', icon: 'bg-green-500/20' },
  vehicle_delivered: { label: 'Vehicle delivered', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  photo_captured: { label: 'Photo captured', color: 'text-cyan-400', icon: 'bg-cyan-500/20' },
  note_added: { label: 'Note added', color: 'text-sky-400', icon: 'bg-sky-500/20' },
  pressure_test_completed: { label: 'Pressure test done', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
  road_test_completed: { label: 'Road test done', color: 'text-emerald-400', icon: 'bg-emerald-500/20' },
};

function formatTimestamp(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

interface ActivityTimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function ActivityTimeline({ events, className }: ActivityTimelineProps) {
  if (events.length === 0) {
    return (
      <div className={className}>
        <p className="text-sm text-wg-muted text-center py-6">No activity yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-0">
        {events.map((event, i) => {
          const config = ACTION_CONFIG[event.action] ?? { label: event.action, color: 'text-wg-text2', icon: 'bg-wg-bg2' };
          const isLast = i === events.length - 1;

          return (
            <div key={event.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-2 h-2 rounded-full mt-2 ${config.icon} ring-2 ring-wg-bg`} />
                {!isLast && <div className="w-px flex-1 bg-wg-border" />}
              </div>
              <div className={`pb-4 min-w-0 flex-1 ${isLast ? '' : ''}`}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  <span className="text-xs text-wg-muted">{formatTimestamp(event.created_at)}</span>
                </div>
                {event.actor_name && (
                  <p className="text-xs text-wg-text2 mt-0.5">by {event.actor_name}</p>
                )}
                {event.changes && Object.keys(event.changes).length > 0 && (
                  <div className="mt-1 text-xs text-wg-muted">
                    {Object.entries(event.changes).slice(0, 3).map(([key, val]) => {
                      const display = val !== null && typeof val === 'object' ? JSON.stringify(val) : String(val ?? '');
                      return (
                        <span key={key} className="mr-3">
                          {key.replace(/_/g, ' ')}: <span className="text-wg-text2">{display}</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
