import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { fetchVehicles } from '@/lib/queries';
import { VehicleBrowser } from './vehicle-browser';

export default async function VehiclesPage() {
  const vehicles = await fetchVehicles();

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Vehicles"
          subtitle={`${vehicles.length} vehicles in system`}
          actions={
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/intake/new">
                <Button>
                  <Plus size={16} />
                  <span className="hidden sm:inline">New Vehicle</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </Link>
            </div>
          }
        />

        <VehicleBrowser vehicles={vehicles} />
      </div>
    </AppShell>
  );
}
