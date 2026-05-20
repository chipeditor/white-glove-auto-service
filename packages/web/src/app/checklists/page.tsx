import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckSquare } from 'lucide-react';

export default function ChecklistsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Checklists" subtitle="Service and delivery checklists" />
        <div className="mt-8">
          <EmptyState
            icon={CheckSquare}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
