import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Settings } from 'lucide-react';
import { fetchNotifications, getCurrentUser } from '@/lib/queries';
import { NotificationList } from './notification-list';

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  const notifications = user ? await fetchNotifications(user.id) : [];

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
        <NotificationList notifications={notifications} />
      </div>
    </AppShell>
  );
}
