import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  fetchInspection,
  fetchInspectionSections,
  fetchDamageMarkers,
} from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { UploadedFile } from '@/components/ui/FileUpload';
import { InspectionWorkspace } from './inspection-workspace';

const TYPE_LABELS: Record<string, string> = {
  intake: 'Intake Inspection',
  mechanical: 'Mechanical Inspection',
  cosmetic: 'Cosmetic Inspection',
  delivery: 'Delivery Inspection',
  quality_control: 'Quality Control',
  spot_check: 'Spot Check',
};

export default async function InspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const inspection = await fetchInspection(id);
  if (!inspection) notFound();

  const [sections, markers] = await Promise.all([
    fetchInspectionSections(id),
    fetchDamageMarkers(id),
  ]);

  const vehicle = inspection.vehicle;
  const vehicleName = vehicle
    ? `${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`.trim()
    : 'Vehicle';

  const supabase = await createServerSupabaseClient();
  const { data: mediaAssets } = vehicle
    ? await supabase
        .from('media_assets')
        .select('*')
        .eq('vehicle_id', vehicle.id)
        .order('created_at', { ascending: false })
    : { data: [] };

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title={TYPE_LABELS[inspection.type] ?? 'Inspection'}
          subtitle={
            inspection.inspector?.full_name
              ? `Inspector: ${inspection.inspector.full_name}`
              : undefined
          }
          breadcrumbs={[
            { label: 'Inspections', href: '/inspections' },
            ...(vehicle
              ? [{ label: vehicleName, href: `/vehicles/${vehicle.id}` }]
              : []),
            { label: TYPE_LABELS[inspection.type] ?? 'Inspection' },
          ]}
          actions={<StatusBadge status={inspection.status} />}
        />

        <InspectionWorkspace
          inspectionId={id}
          vehicleId={vehicle?.id ?? null}
          organizationId={inspection.organization_id}
          sections={sections}
          markers={markers}
          mediaAssets={(mediaAssets ?? []) as UploadedFile[]}
          status={inspection.status}
        />
      </div>
    </AppShell>
  );
}
