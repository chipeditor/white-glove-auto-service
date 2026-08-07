'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Car, ClipboardCheck, Wrench, History as HistoryIcon, LogIn } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AffiliateCard } from '@/components/ui/AffiliateCard';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { FileUpload, type UploadedFile } from '@/components/ui/FileUpload';
import { ChecklistProgress, ChecklistItemRow } from '@/components/checklist/ChecklistCard';
import type {
  VehicleWithCustomer,
  Checklist,
  ChecklistItem,
  AffiliateRecommendation,
  InspectionType,
} from '@/shared/types';
import type {
  VehicleInspectionSummary,
  VehicleServiceRequestSummary,
  VehicleHistoryEvent,
} from '@/lib/queries';

const TABS = ['Overview', 'Intake', 'Inspections', 'Service Request', 'Checklists', 'Files', 'History'];

/// The vehicle lifecycle, in order. `intake_started` and `archived` are
/// deliberately absent — they sit outside this pipeline, and a vehicle in
/// either state shows no completed steps rather than a fabricated position.
const VEHICLE_STAGES: { label: string; status: string }[] = [
  { label: 'Intake Completed', status: 'intake_completed' },
  { label: 'In Service', status: 'in_service' },
  { label: 'Awaiting Approval', status: 'awaiting_approval' },
  { label: 'Ready for Delivery', status: 'ready_for_delivery' },
  { label: 'Delivered', status: 'delivered' },
];

const TYPE_LABELS: Record<InspectionType, string> = {
  intake: 'Intake',
  mechanical: 'Mechanical',
  cosmetic: 'Cosmetic',
  delivery: 'Delivery',
  quality_control: 'Quality Control',
  spot_check: 'Spot Check',
};

const TYPE_STYLES: Record<InspectionType, string> = {
  intake: 'bg-blue-500/15 text-blue-400',
  mechanical: 'bg-orange-500/15 text-orange-400',
  cosmetic: 'bg-pink-500/15 text-pink-400',
  delivery: 'bg-emerald-500/15 text-emerald-400',
  quality_control: 'bg-purple-500/15 text-purple-400',
  spot_check: 'bg-amber-500/15 text-amber-400',
};

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="bg-wg-card rounded-xl border border-wg-border p-8 text-center">
      <div className="w-12 h-12 bg-wg-bg2 rounded-xl flex items-center justify-center mx-auto mb-3 text-wg-muted">
        {icon}
      </div>
      <p className="text-sm text-wg-text2">{message}</p>
    </div>
  );
}

function InspectionCard({ inspection }: { inspection: VehicleInspectionSummary }) {
  const started = formatDate(inspection.started_at ?? inspection.created_at);
  const completed = formatDate(inspection.completed_at);

  return (
    <Link
      href={`/inspection/${inspection.id}`}
      className="block bg-wg-card rounded-xl border border-wg-border p-4 hover:bg-wg-card-hover transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${TYPE_STYLES[inspection.type] ?? 'bg-wg-bg2 text-wg-text2'}`}
        >
          {TYPE_LABELS[inspection.type] ?? inspection.type}
        </span>
        <StatusBadge status={inspection.status} />
      </div>

      {inspection.service_request && (
        <p className="text-sm text-wg-text mt-2">{inspection.service_request.title}</p>
      )}

      <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-xs text-wg-muted">
        <span>
          Inspector:{' '}
          <span className="text-wg-text2">
            {inspection.inspector?.full_name ?? 'Unassigned'}
          </span>
        </span>
        {started && (
          <span>
            Started: <span className="text-wg-text2">{started}</span>
          </span>
        )}
        {completed && (
          <span>
            Completed: <span className="text-wg-text2">{completed}</span>
          </span>
        )}
      </div>

      {inspection.total_items > 0 ? (
        <ChecklistProgress
          completed={inspection.checked_items}
          total={inspection.total_items}
          className="mt-3"
        />
      ) : (
        <p className="text-xs text-wg-muted mt-3">No inspection items have been added yet.</p>
      )}
    </Link>
  );
}

interface Props {
  vehicle: VehicleWithCustomer;
  inspections: VehicleInspectionSummary[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  affiliates: AffiliateRecommendation[];
  serviceRequests: VehicleServiceRequestSummary[];
  files: UploadedFile[];
  history: VehicleHistoryEvent[];
}

export function VehicleDetailTabs({
  vehicle,
  inspections,
  checklists,
  affiliates,
  serviceRequests,
  files,
  history,
}: Props) {
  const [activeTab, setActiveTab] = useState('Overview');
  const checklist = checklists[0];
  const serviceRequest = serviceRequests[0];
  const intakeInspection = inspections.find((i) => i.type === 'intake');

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mt-4">
        <div className="w-full sm:w-40 h-28 bg-wg-card rounded-xl border border-wg-border flex items-center justify-center flex-shrink-0">
          <Car size={40} className="text-wg-muted" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold text-wg-text">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </h1>
            <StatusBadge status={vehicle.status} />
          </div>
          <p className="text-sm text-wg-text2 mt-1 break-all">VIN: {vehicle.vin ?? 'Not recorded'}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3 text-sm">
            <div>
              <span className="text-wg-muted">Mileage</span>
              <p className="text-wg-text font-medium">
                {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} mi` : '—'}
              </p>
            </div>
            <div>
              <span className="text-wg-muted">Color</span>
              <p className="text-wg-text font-medium">{vehicle.color ?? '—'}</p>
            </div>
            <div>
              <span className="text-wg-muted">Engine</span>
              <p className="text-wg-text font-medium">{vehicle.engine ?? '—'}</p>
            </div>
            <div>
              <span className="text-wg-muted">Transmission</span>
              <p className="text-wg-text font-medium">{vehicle.transmission ?? '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 mt-6 border-b border-wg-border overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab
                ? 'text-wg-blue border-wg-blue'
                : 'text-wg-text2 border-transparent hover:text-wg-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            {serviceRequest && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-1">Service Request</h3>
                <p className="text-sm text-wg-text2">{serviceRequest.title}</p>
                <Link
                  href={`/service-requests/${serviceRequest.id}`}
                  className="text-sm text-wg-blue mt-2 inline-block hover:underline"
                >
                  View Details →
                </Link>
              </div>
            )}

            <div className="bg-wg-card rounded-xl border border-wg-border p-5">
              <h3 className="text-sm font-medium text-wg-text mb-1">Customer</h3>
              {vehicle.customer ? (
                <>
                  <p className="text-sm text-wg-text">{vehicle.customer.full_name}</p>
                  <p className="text-xs text-wg-text2">{vehicle.customer.email}</p>
                  <p className="text-xs text-wg-text2">{vehicle.customer.phone}</p>
                </>
              ) : (
                <p className="text-sm text-wg-muted">No customer linked</p>
              )}
            </div>

            <div className="bg-wg-card rounded-xl border border-wg-border p-5">
              <h3 className="text-sm font-medium text-wg-text mb-3">Status</h3>
              <div className="flex items-center gap-4 overflow-x-auto pb-1">
                {VEHICLE_STAGES.map(
                  ({ label: step, status: stageStatus }, i) => {
                    // Driven by the vehicle's real status. A status outside the
                    // pipeline (e.g. archived) leaves every step incomplete
                    // rather than inventing progress.
                    const currentIdx = VEHICLE_STAGES.findIndex(
                      (s) => s.status === vehicle.status
                    );
                    const completed = currentIdx >= 0 && i < currentIdx;
                    const active = stageStatus === vehicle.status;
                    return (
                      <div key={step} className="flex items-center gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                              completed
                                ? 'bg-wg-green text-white'
                                : active
                                  ? 'bg-wg-blue text-white'
                                  : 'border border-wg-border text-wg-muted'
                            }`}
                          >
                            {completed ? '✓' : ''}
                          </div>
                          <span className="text-[10px] text-wg-muted mt-1 text-center max-w-[80px]">
                            {step}
                          </span>
                        </div>
                        {i < VEHICLE_STAGES.length - 1 && (
                          <div className="w-8 h-px bg-wg-border" />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-wg-card rounded-xl border border-wg-border p-5">
              <h3 className="text-sm font-medium text-wg-text mb-3">Vehicle Progress</h3>
              {checklist && (
                <ChecklistProgress
                  completed={checklist.completed_items}
                  total={checklist.total_items}
                />
              )}
              <div className="mt-4 space-y-2">
                {inspections.map((insp) => (
                  <div key={insp.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-wg-text2">
                      {TYPE_LABELS[insp.type] ?? insp.type} Inspection
                    </span>
                    <StatusBadge status={insp.status} />
                  </div>
                ))}
              </div>
            </div>

            {affiliates.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-wg-text mb-3">Affiliate Recommendations</h3>
                <AffiliateCard recommendation={affiliates[0]} />
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Intake' && (
        <div className="max-w-3xl mt-6 space-y-4 sm:space-y-6">
          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <h3 className="text-sm font-medium text-wg-text mb-4">Intake Details</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs text-wg-muted">VIN</dt>
                <dd className="text-sm text-wg-text break-all">{vehicle.vin ?? 'Not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs text-wg-muted">Mileage at intake</dt>
                <dd className="text-sm text-wg-text">
                  {vehicle.mileage != null ? `${vehicle.mileage.toLocaleString()} mi` : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-wg-muted">License plate</dt>
                <dd className="text-sm text-wg-text">
                  {vehicle.license_plate
                    ? `${vehicle.license_plate}${vehicle.state ? ` (${vehicle.state})` : ''}`
                    : 'Not recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-wg-muted">Color</dt>
                <dd className="text-sm text-wg-text">{vehicle.color ?? 'Not recorded'}</dd>
              </div>
              <div>
                <dt className="text-xs text-wg-muted">Intake date</dt>
                <dd className="text-sm text-wg-text">
                  {intakeInspection
                    ? (formatDate(intakeInspection.started_at ?? intakeInspection.created_at) ??
                      'Not recorded')
                    : 'No intake inspection recorded'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-wg-muted">Vehicle added</dt>
                <dd className="text-sm text-wg-text">
                  {formatDate(vehicle.created_at) ?? 'Not recorded'}
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="text-sm font-medium text-wg-text mb-3">Intake Inspection</h3>
            {intakeInspection ? (
              <InspectionCard inspection={intakeInspection} />
            ) : (
              <EmptyState
                icon={<LogIn size={22} />}
                message="No intake inspection has been performed for this vehicle."
              />
            )}
          </div>
        </div>
      )}

      {activeTab === 'Inspections' && (
        <div className="max-w-3xl mt-6 space-y-3">
          {inspections.length > 0 ? (
            inspections.map((insp) => <InspectionCard key={insp.id} inspection={insp} />)
          ) : (
            <EmptyState
              icon={<ClipboardCheck size={22} />}
              message="No inspections recorded for this vehicle."
            />
          )}
        </div>
      )}

      {activeTab === 'Service Request' && (
        <div className="max-w-3xl mt-6 space-y-3">
          {serviceRequests.length > 0 ? (
            serviceRequests.map((sr) => (
              <Link
                key={sr.id}
                href={`/service-requests/${sr.id}`}
                className="block bg-wg-card rounded-xl border border-wg-border p-4 hover:bg-wg-card-hover transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className="text-sm font-medium text-wg-text">{sr.title}</span>
                  <StatusBadge status={sr.status} />
                </div>
                {sr.description && (
                  <p className="text-xs text-wg-text2 mt-1 line-clamp-2">{sr.description}</p>
                )}
                <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-wg-muted">
                  <span>
                    Technician:{' '}
                    <span className="text-wg-text2">{sr.technician?.full_name ?? 'Unassigned'}</span>
                  </span>
                  {sr.advisor && (
                    <span>
                      Advisor: <span className="text-wg-text2">{sr.advisor.full_name}</span>
                    </span>
                  )}
                  <span>
                    Created:{' '}
                    <span className="text-wg-text2">{formatDate(sr.created_at) ?? '—'}</span>
                  </span>
                  <span>
                    Total:{' '}
                    <span className="text-wg-text2">{formatCurrency(sr.total ?? 0)}</span>
                  </span>
                </div>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={<Wrench size={22} />}
              message="No service requests recorded for this vehicle."
            />
          )}
        </div>
      )}

      {activeTab === 'Checklists' && (
        <div className="max-w-2xl mt-6">
          {checklist ? (
            <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
              <div className="p-5 border-b border-wg-border">
                <h3 className="text-sm font-medium text-wg-text">{checklist.title}</h3>
                <ChecklistProgress
                  completed={checklist.completed_items}
                  total={checklist.total_items}
                  className="mt-3"
                />
              </div>
              {checklist.items.map((item) => (
                <ChecklistItemRow key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardCheck size={22} />}
              message="No checklists recorded for this vehicle."
            />
          )}
        </div>
      )}

      {activeTab === 'Files' && (
        <div className="max-w-3xl mt-6">
          <div className="bg-wg-card rounded-xl border border-wg-border p-4 sm:p-5">
            <h3 className="text-sm font-medium text-wg-text mb-1">Photos &amp; Documents</h3>
            <p className="text-xs text-wg-muted mb-4">
              {files.length > 0
                ? `${files.length} file${files.length === 1 ? '' : 's'} attached to this vehicle.`
                : 'No files have been uploaded for this vehicle yet.'}
            </p>
            <FileUpload
              vehicleId={vehicle.id}
              organizationId={vehicle.organization_id}
              existingFiles={files}
            />
          </div>
        </div>
      )}

      {activeTab === 'History' && (
        <div className="max-w-3xl mt-6">
          {history.length > 0 ? (
            <div className="bg-wg-card rounded-xl border border-wg-border p-4 sm:p-5">
              <h3 className="text-sm font-medium text-wg-text mb-4">Activity</h3>
              <ActivityTimeline events={history} />
            </div>
          ) : (
            <EmptyState
              icon={<HistoryIcon size={22} />}
              message="No activity has been recorded for this vehicle."
            />
          )}
        </div>
      )}
    </>
  );
}
