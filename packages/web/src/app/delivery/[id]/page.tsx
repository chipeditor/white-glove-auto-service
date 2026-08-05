import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DeliveryChecklist } from './delivery-checklist';

const DELIVERY_ITEMS = [
  'Final exterior wash and detail',
  'Interior vacuum and wipe-down',
  'Verify all service work completed',
  'Check fluid levels (oil, coolant, brake, washer)',
  'Confirm tire pressures set to spec',
  'Remove seat covers and floor mats protectors',
  'Place floor mats back in vehicle',
  'Reset maintenance reminder / service light',
  'Verify no tools or parts left in vehicle',
  'Walk-around inspection with customer',
  'Review completed work with customer',
  'Collect customer signature',
];

export default async function DeliveryChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: sr } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .eq('id', id)
    .single();

  if (!sr) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user?.id ?? '')
    .eq('is_active', true)
    .limit(1)
    .single();

  let checklist = null;
  let checklistItems: Array<{ id: string; label: string; sort_order: number; completed: boolean; completed_at: string | null; notes: string | null }> = [];

  const { data: existingChecklist } = await supabase
    .from('checklists')
    .select('*')
    .eq('service_request_id', id)
    .eq('title', 'Delivery Checklist')
    .limit(1)
    .single();

  if (existingChecklist) {
    checklist = existingChecklist;
    const { data: items } = await supabase
      .from('checklist_items')
      .select('*')
      .eq('checklist_id', existingChecklist.id)
      .order('sort_order');
    checklistItems = items ?? [];
  }

  const vehicle = sr.vehicle as Record<string, unknown> | null;
  const customer = sr.customer as Record<string, unknown> | null;

  return (
    <AppShell>
      <div className="p-8 max-w-3xl mx-auto">
        <PageHeader
          title="Delivery Checklist"
          breadcrumbs={[
            { label: 'Service Requests', href: '/service-requests' },
            { label: String(sr.title), href: `/service-requests/${id}` },
            { label: 'Delivery' },
          ]}
          actions={<StatusBadge status={sr.status} />}
        />

        <div className="mt-6 grid grid-cols-2 gap-4">
          {vehicle && (
            <div className="bg-wg-card rounded-xl border border-wg-border p-4">
              <p className="text-xs text-wg-muted mb-1">Vehicle</p>
              <p className="text-sm font-medium text-wg-text">
                {String(vehicle.year ?? '')} {String(vehicle.make ?? '')} {String(vehicle.model ?? '')}
              </p>
              {vehicle.vin ? <p className="text-xs text-wg-muted mt-0.5">VIN: {String(vehicle.vin)}</p> : null}
            </div>
          )}
          {customer && (
            <div className="bg-wg-card rounded-xl border border-wg-border p-4">
              <p className="text-xs text-wg-muted mb-1">Customer</p>
              <p className="text-sm font-medium text-wg-text">{String(customer.full_name)}</p>
              {customer.phone ? <p className="text-xs text-wg-muted mt-0.5">{String(customer.phone)}</p> : null}
            </div>
          )}
        </div>

        <div className="mt-6">
          <DeliveryChecklist
            serviceRequestId={id}
            organizationId={membership?.organization_id ?? sr.organization_id}
            vehicleId={String(vehicle?.id ?? '')}
            checklist={checklist}
            items={checklistItems}
            defaultItems={DELIVERY_ITEMS}
            customerName={customer ? String(customer.full_name ?? '') : ''}
            customerEmail={customer ? String(customer.email ?? '') : ''}
            customerPhone={customer ? String(customer.phone ?? '') : ''}
            customerId={customer ? String(customer.id ?? '') : ''}
          />
        </div>
      </div>
    </AppShell>
  );
}
