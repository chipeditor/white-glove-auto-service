import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { fetchAllInspections } from '@/lib/queries';
import { InspectionsTable } from './inspections-table';

export default async function InspectionsPage() {
  const inspections = await fetchAllInspections();

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Inspections"
          subtitle={`${inspections.length} total inspections`}
        />

        <div className="mt-6">
          <InspectionsTable inspections={inspections} />
        </div>
      </div>
    </AppShell>
  );
}
