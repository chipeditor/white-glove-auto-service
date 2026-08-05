import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Car, User, DollarSign, FileText, Printer, Truck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { FileUpload } from '@/components/ui/FileUpload';
import { fetchServiceRequest } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { ServiceRequestStatus } from '@/shared/types';
import { ServiceRequestLineItems } from './line-items';

const STATUS_PIPELINE: ServiceRequestStatus[] = [
  'draft',
  'submitted',
  'awaiting_customer_approval',
  'approved',
  'in_progress',
  'quality_control',
  'ready_for_delivery',
  'completed',
];

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  awaiting_customer_approval: 'Approval',
  approved: 'Approved',
  in_progress: 'In Progress',
  quality_control: 'QC',
  ready_for_delivery: 'Ready',
  completed: 'Complete',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default async function ServiceRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sr = await fetchServiceRequest(id);

  if (!sr) notFound();

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: events } = await supabase
    .from('audit_events')
    .select('*')
    .eq('entity_type', 'service_request')
    .eq('entity_id', id)
    .order('created_at', { ascending: false })
    .limit(50);

  const vehicleId = sr.vehicle?.id;
  const { data: mediaAssets } = vehicleId
    ? await supabase
        .from('media_assets')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false })
    : { data: [] };

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user?.id ?? '')
    .eq('is_active', true)
    .limit(1)
    .single();
  const orgId = membership?.organization_id || sr.organization_id;

  const actorIds = [...new Set((events ?? []).map(e => e.actor_id).filter(Boolean))] as string[];
  let actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', actorIds);
    actorMap = Object.fromEntries((users ?? []).map(u => [u.id, u.full_name]));
  }

  const timelineEvents = (events ?? []).map(e => ({
    ...e,
    actor_name: e.actor_id ? actorMap[e.actor_id] : undefined,
  }));

  const currentIdx = STATUS_PIPELINE.indexOf(sr.status);
  const isDeclined = sr.status === 'declined';

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title={sr.title}
          breadcrumbs={[
            { label: 'Service Requests', href: '/service-requests' },
            { label: sr.title },
          ]}
          actions={<StatusBadge status={sr.status} />}
        />

        {/* Status Pipeline */}
        {!isDeclined && (
          <div className="mt-6 bg-wg-card rounded-xl border border-wg-border p-4">
            <div className="flex items-center justify-between">
              {STATUS_PIPELINE.map((step, i) => {
                const done = i <= currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          done
                            ? active
                              ? 'bg-wg-blue text-white'
                              : 'bg-wg-blue/20 text-wg-blue'
                            : 'bg-wg-bg2 text-wg-muted'
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-[10px] mt-1 ${
                          active ? 'text-wg-blue font-medium' : done ? 'text-wg-text2' : 'text-wg-muted'
                        }`}
                      >
                        {STATUS_LABELS[step]}
                      </span>
                    </div>
                    {i < STATUS_PIPELINE.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-2 mt-[-14px] ${
                          i < currentIdx ? 'bg-wg-blue/30' : 'bg-wg-border'
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {isDeclined && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
            <span className="text-sm text-red-400 font-medium">This service request was declined by the customer.</span>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {sr.description && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-2">Description</h3>
                <p className="text-sm text-wg-text2 whitespace-pre-wrap">{sr.description}</p>
              </div>
            )}

            {/* Line Items */}
            <ServiceRequestLineItems lines={sr.lines} sr={sr} />

            {/* Photos & Files */}
            {vehicleId && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-4">Photos &amp; Files</h3>
                <FileUpload
                  vehicleId={vehicleId}
                  organizationId={orgId}
                  existingFiles={mediaAssets ?? []}
                />
              </div>
            )}

            {/* Activity Timeline */}
            {timelineEvents.length > 0 && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-4">Activity</h3>
                <ActivityTimeline events={timelineEvents} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Vehicle Card */}
            {sr.vehicle && (
              <Link
                href={`/vehicles/${sr.vehicle.id}`}
                className="block bg-wg-card rounded-xl border border-wg-border p-4 hover:bg-wg-card-hover transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-wg-bg2 flex items-center justify-center">
                    <Car size={16} className="text-wg-text2" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-wg-text">
                      {sr.vehicle.year} {sr.vehicle.make} {sr.vehicle.model}
                    </span>
                    {sr.vehicle.trim && (
                      <span className="text-xs text-wg-muted ml-1">{sr.vehicle.trim}</span>
                    )}
                  </div>
                </div>
                {sr.vehicle.vin && (
                  <p className="text-xs text-wg-muted">VIN: {sr.vehicle.vin}</p>
                )}
                {sr.vehicle.mileage && (
                  <p className="text-xs text-wg-muted">{sr.vehicle.mileage.toLocaleString()} miles</p>
                )}
              </Link>
            )}

            {/* Customer Card */}
            {sr.customer && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-wg-bg2 flex items-center justify-center">
                    <User size={16} className="text-wg-text2" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-wg-text">{sr.customer.full_name}</span>
                    {sr.customer.phone && (
                      <p className="text-xs text-wg-muted">{sr.customer.phone}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Details */}
            <div className="bg-wg-card rounded-xl border border-wg-border p-4 space-y-3">
              {sr.advisor && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-wg-muted">Advisor</span>
                  <span className="text-sm text-wg-text">{sr.advisor.full_name}</span>
                </div>
              )}
              {sr.technician && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-wg-muted">Technician</span>
                  <span className="text-sm text-wg-text">{sr.technician.full_name}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-wg-muted">Priority</span>
                <span className="text-sm text-wg-text">
                  {sr.priority === 0 ? 'Normal' : sr.priority === 1 ? 'High' : 'Urgent'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-wg-muted">Created</span>
                <span className="text-xs text-wg-text2">{formatDate(sr.created_at)}</span>
              </div>
              {sr.estimated_completion && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-wg-muted">Est. Completion</span>
                  <span className="text-xs text-wg-text2">{formatDate(sr.estimated_completion)}</span>
                </div>
              )}
            </div>

            {/* Reports */}
            <div className="bg-wg-card rounded-xl border border-wg-border p-4 space-y-2">
              <span className="text-sm font-medium text-wg-text">Documents</span>
              <Link
                href={`/reports/estimate/${id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-wg-bg2 hover:bg-wg-input text-sm text-wg-text2 hover:text-wg-text transition-colors"
              >
                <FileText size={14} />
                View Estimate
              </Link>
              <Link
                href={`/reports/receipt/${id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-wg-bg2 hover:bg-wg-input text-sm text-wg-text2 hover:text-wg-text transition-colors"
              >
                <Printer size={14} />
                Print Receipt
              </Link>
              <Link
                href={`/delivery/${id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-wg-bg2 hover:bg-wg-input text-sm text-wg-text2 hover:text-wg-text transition-colors"
              >
                <Truck size={14} />
                Delivery Checklist
              </Link>
            </div>

            {/* Totals */}
            <div className="bg-wg-card rounded-xl border border-wg-border p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign size={14} className="text-wg-text2" />
                <span className="text-sm font-medium text-wg-text">Totals</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-wg-muted">Subtotal</span>
                  <span className="text-sm text-wg-text">{formatCurrency(sr.subtotal || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-wg-muted">Tax</span>
                  <span className="text-sm text-wg-text">{formatCurrency(sr.tax_amount || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-wg-border pt-2">
                  <span className="text-sm font-medium text-wg-text">Total</span>
                  <span className="text-sm font-bold text-wg-text">{formatCurrency(sr.total || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
