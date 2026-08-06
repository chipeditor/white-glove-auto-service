import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { CheckSquare } from 'lucide-react';
import { fetchAllChecklists } from '@/lib/queries';
import { ChecklistsTable } from './checklists-table';

export default async function ChecklistsPage() {
  const checklists = await fetchAllChecklists();

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Checklists"
          subtitle={`${checklists.length} total checklists`}
        />

        <div className="mt-6">
          {checklists.length === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="No Checklists"
              description="Checklists will appear here once they are created from a service request."
            />
          ) : (
            <ChecklistsTable checklists={checklists} />
          )}
        </div>
      </div>
    </AppShell>
  );
}
