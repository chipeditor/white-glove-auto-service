'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCheck, Loader2 } from 'lucide-react';
import { NotificationItem } from '@/components/notification/NotificationItem';
import type { Notification, NotificationType } from '@/shared/types';

type Tab = 'All' | 'Unread' | 'Updates' | 'Alerts';

const TABS: Tab[] = ['All', 'Unread', 'Updates', 'Alerts'];

/// Anything that needs someone to act, as opposed to progress reporting.
const ALERT_TYPES: NotificationType[] = ['approval_needed', 'issue_flagged'];

function matchesTab(notification: Notification, tab: Tab): boolean {
  switch (tab) {
    case 'All':
      return true;
    case 'Unread':
      return !notification.read;
    case 'Alerts':
      return ALERT_TYPES.includes(notification.type);
    case 'Updates':
      return !ALERT_TYPES.includes(notification.type);
  }
}

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('All');
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  const filtered = notifications.filter((n) => matchesTab(n, activeTab));
  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(payload: { id?: string; all?: boolean }) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        startTransition(() => router.refresh());
      }
    } finally {
      setBusy(false);
    }
  }

  const working = busy || isPending;

  return (
    <>
      <div className="flex items-center gap-1 mt-6 mb-4 flex-wrap">
        {TABS.map((tab) => {
          const count = notifications.filter((n) => matchesTab(n, tab)).length;
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active ? 'bg-wg-blue/10 text-wg-blue' : 'text-wg-text2 hover:bg-wg-card'
              }`}
            >
              {tab}
              {count > 0 && (
                <span className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {unreadCount > 0 && (
          <button
            onClick={() => markRead({ all: true })}
            disabled={working}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-wg-text2 hover:text-wg-text hover:bg-wg-card transition-colors disabled:opacity-50"
          >
            {working ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
            Mark all read
          </button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden divide-y divide-wg-border">
          {filtered.map((n) => (
            <NotificationItem
              key={n.id}
              notification={n}
              onMarkRead={n.read ? undefined : () => markRead({ id: n.id })}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-sm text-wg-muted">No notifications</p>
        </div>
      )}
    </>
  );
}
