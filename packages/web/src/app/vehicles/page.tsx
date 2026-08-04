import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { VehicleTable } from '@/components/vehicle/VehicleCard';
import { fetchVehicles } from '@/lib/queries';

export default async function VehiclesPage() {
  const vehicles = await fetchVehicles();

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Vehicles"
          subtitle={`${vehicles.length} vehicles in system`}
          actions={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wg-muted" />
                <input
                  type="text"
                  placeholder="Search vehicles..."
                  className="bg-wg-input border border-wg-border rounded-lg pl-9 pr-4 py-2 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50 w-64"
                />
              </div>
              <Link href="/intake/new">
                <Button>
                  <Plus size={16} />
                  New Vehicle
                </Button>
              </Link>
            </div>
          }
        />

        <div className="flex gap-2 mt-6 mb-4">
          {['All', 'In Service', 'Ready for Delivery', 'Awaiting Approval', 'Delivered'].map((filter) => (
            <button
              key={filter}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filter === 'All'
                  ? 'bg-wg-blue/10 text-wg-blue'
                  : 'text-wg-text2 hover:bg-wg-card'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <VehicleTable vehicles={vehicles} />
      </div>
    </AppShell>
  );
}
