'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { NotificationItem } from '@/components/notification/NotificationItem';
import { MOCK_NOTIFICATIONS } from '@/lib/mock-data';

const TABS = ['All', 'Unread', 'Updates', 'Alerts'];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('All');

  const filtered = activeTab === 'All'
    ? MOCK_NOTIFICATIONS
    : activeTab === 'Unread'
      ? MOCK_NOTIFICATIONS.filter((n) => !n.read)
      : MOCK_NOTIFICATIONS;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl">
        <PageHeader
          title="Notifications"
          actions={
            <button className="p-2 text-wg-muted hover:text-wg-text transition-colors">
              <Settings size={18} />
            </button>
          }
        />

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

        <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden divide-y divide-wg-border">
          {filtered.map((n) => (
            <NotificationItem key={n.id} notification={n} />
          ))}
        </div>

        <div className="text-center mt-4">
          <button className="text-sm text-wg-blue hover:underline">View All Notifications</button>
        </div>
      </div>
    </AppShell>
  );
}
