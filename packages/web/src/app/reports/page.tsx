import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Reports" subtitle="Inspection and service reports" />
        <div className="mt-8">
          <EmptyState
            icon={BarChart3}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
