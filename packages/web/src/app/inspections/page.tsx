import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Search } from 'lucide-react';

export default function InspectionsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Inspections" subtitle="Vehicle inspection records" />
        <div className="mt-8">
          <EmptyState
            icon={Search}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
