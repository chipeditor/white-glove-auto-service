import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Car } from 'lucide-react';

export default function NewVehiclePage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="New Vehicle"
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: 'New Vehicle' },
          ]}
        />
        <div className="mt-8">
          <EmptyState
            icon={Car}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
