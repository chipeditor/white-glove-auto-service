import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import {
  fetchVehicle,
  fetchChecklists,
  fetchAffiliateRecommendations,
  fetchVehicleInspections,
  fetchVehicleServiceRequests,
  fetchVehicleMedia,
  fetchVehicleHistory,
} from '@/lib/queries';
import { ChevronDown } from 'lucide-react';
import { VehicleDetailTabs } from './vehicle-detail-tabs';

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await fetchVehicle(id);

  if (!vehicle) notFound();

  const [inspections, checklists, affiliates, serviceRequests, files, history] = await Promise.all([
    fetchVehicleInspections(id),
    fetchChecklists(id),
    fetchAffiliateRecommendations(id),
    fetchVehicleServiceRequests(id),
    fetchVehicleMedia(id),
    fetchVehicleHistory(id),
  ]);

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim ?? ''}` },
          ]}
          title=""
          actions={
            <Button variant="secondary">
              Actions <ChevronDown size={14} />
            </Button>
          }
        />

        <VehicleDetailTabs
          vehicle={vehicle}
          inspections={inspections}
          checklists={checklists}
          affiliates={affiliates}
          serviceRequests={serviceRequests}
          files={files}
          history={history}
        />
      </div>
    </AppShell>
  );
}
