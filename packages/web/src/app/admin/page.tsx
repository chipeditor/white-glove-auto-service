import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shield } from 'lucide-react';

export default function AdminPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Admin" subtitle="System administration" />
        <div className="mt-8">
          <EmptyState
            icon={Shield}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
