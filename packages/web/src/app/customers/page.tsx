import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Customers" subtitle="Customer directory" />
        <div className="mt-8">
          <EmptyState
            icon={Users}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
