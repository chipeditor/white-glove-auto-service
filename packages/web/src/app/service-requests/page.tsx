import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function ServiceRequestsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Service Requests" subtitle="Track and manage service requests" />
        <div className="mt-8">
          <EmptyState
            icon={ClipboardList}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
