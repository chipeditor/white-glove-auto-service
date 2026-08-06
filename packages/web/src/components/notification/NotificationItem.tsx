import Link from 'next/link';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import type { Notification } from '@/shared/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const TYPE_COLORS: Record<string, string> = {
  intake_completed: 'bg-cyan-500',
  approval_needed: 'bg-amber-500',
  service_started: 'bg-green-500',
  service_completed: 'bg-emerald-500',
  delivery_ready: 'bg-emerald-500',
  vehicle_delivered: 'bg-slate-500',
  issue_flagged: 'bg-red-500',
  report_ready: 'bg-blue-500',
  intake_started: 'bg-blue-500',
  approval_received: 'bg-green-500',
};

interface NotificationItemProps {
  notification: Notification;
  /** Omitted when already read, which also hides the control. */
  onMarkRead?: () => void;
}

export function NotificationItem({ notification, onMarkRead }: NotificationItemProps) {
  const content = (
    <div
      className="flex gap-3 px-4 py-3 transition-colors hover:bg-wg-card-hover"
    >
      <div className="mt-1.5">
        <div className={clsx('w-2.5 h-2.5 rounded-full', TYPE_COLORS[notification.type] ?? 'bg-gray-500')} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={clsx('text-sm font-medium', !notification.read ? 'text-wg-text' : 'text-wg-text2')}>
            {notification.title}
          </span>
          <span className="text-xs text-wg-muted whitespace-nowrap">{timeAgo(notification.created_at)}</span>
        </div>
        <p className="text-sm text-wg-text2 mt-0.5 line-clamp-2">{notification.body}</p>
      </div>
    </div>
  );

  // The mark-read control sits beside the link rather than inside it, so the
  // two interactive targets never nest.
  return (
    <div className={clsx('flex items-center', !notification.read && 'bg-wg-blue/5')}>
      {notification.action_url ? (
        <Link href={notification.action_url} className="flex-1 min-w-0">
          {content}
        </Link>
      ) : (
        <div className="flex-1 min-w-0">{content}</div>
      )}
      {onMarkRead && (
        <button
          onClick={onMarkRead}
          title="Mark as read"
          aria-label={`Mark "${notification.title}" as read`}
          className="shrink-0 p-2 mr-2 rounded-lg text-wg-muted hover:text-wg-blue hover:bg-wg-card transition-colors"
        >
          <Check size={15} />
        </button>
      )}
    </div>
  );
}
