'use client';

import { useState } from 'react';
import { NotificationItem } from '@/components/notification/NotificationItem';
import type { Notification } from '@/shared/types';

const TABS = ['All', 'Unread', 'Updates', 'Alerts'];

export function NotificationList({ notifications }: { notifications: Notification[] }) {
  const [activeTab, setActiveTab] = useState('All');

  const filtered =
    activeTab === 'All'
      ? notifications
      : activeTab === 'Unread'
        ? notifications.filter((n) => !n.read)
        : notifications;

  return (
    <>
      <div className="flex gap-1 mt-6 mb-4">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-wg-blue/10 text-wg-blue'
                : 'text-wg-text2 hover:bg-wg-card'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden divide-y divide-wg-border">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} />
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
