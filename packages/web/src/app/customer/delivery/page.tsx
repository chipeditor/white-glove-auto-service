import { Clock, MapPin, CheckCircle, Circle, Sparkles } from 'lucide-react';
import { fetchCustomerDelivery, formatDateTime, vehicleName } from '@/lib/customer-queries';
import { SignedOutNotice, EmptyCard } from '../empty-states';
import { DeliveryScheduler } from './scheduler';

export const dynamic = 'force-dynamic';

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatClock(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

export default async function CustomerDeliveryPage() {
  const view = await fetchCustomerDelivery();

  if (!view) return <SignedOutNotice />;

  const { organization, vehicle, serviceRequest, ready, checklists, appointment, candidateDates } = view;
  const label = vehicle ? vehicleName(vehicle) : 'your vehicle';
  const orgName = organization?.name ?? 'the shop';

  const addressLines = [
    organization?.address_line1,
    organization?.address_line2,
    [organization?.city, organization?.state, organization?.zip].filter(Boolean).join(', ') || null,
  ].filter(Boolean) as string[];

  const location = (
    <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
      <h3 className="text-sm font-semibold text-wg-text mb-3">Pickup Location</h3>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-wg-blue/10 flex items-center justify-center shrink-0">
          <MapPin size={14} className="text-wg-blue" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-wg-text break-words">{orgName}</p>
          {addressLines.length > 0 ? (
            addressLines.map((line) => (
              <p key={line} className="text-xs text-wg-text2 mt-0.5">
                {line}
              </p>
            ))
          ) : (
            <p className="text-xs text-wg-text2 mt-0.5">
              Address not on file — call the shop for directions.
            </p>
          )}
          {organization?.phone && (
            <a
              href={`tel:${organization.phone}`}
              className="text-xs text-[#c8a45c] mt-1 inline-block"
            >
              {organization.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );

  // Already booked a pickup.
  if (appointment) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#c8a45c]/10 to-[#c8a45c]/5 rounded-2xl border border-[#c8a45c]/20 p-6 sm:p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#c8a45c]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-[#c8a45c]" />
          </div>
          <h2 className="text-lg font-semibold text-wg-text">Pickup Confirmed</h2>
          <p className="text-2xl font-bold text-[#c8a45c] mt-2 break-words">
            {formatDate(appointment.scheduled_date)} at {formatClock(appointment.scheduled_time)}
          </p>
          <p className="text-sm text-wg-text2 mt-3 max-w-xs mx-auto">
            We&apos;ll have {label} ready for you. See you then!
          </p>
        </div>

        {location}

        {organization?.phone && (
          <p className="text-center text-xs text-wg-text2">
            Need to reschedule? Call us at{' '}
            <a href={`tel:${organization.phone}`} className="text-[#c8a45c]">
              {organization.phone}
            </a>
            .
          </p>
        )}
      </div>
    );
  }

  if (!serviceRequest && !vehicle) {
    return (
      <EmptyCard
        title="Nothing to pick up yet"
        body="Once your vehicle is checked in and a service request is open, you'll be able to schedule a pickup time here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Readiness banner — derived from the real service request / vehicle status */}
      {ready ? (
        <div className="bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 rounded-2xl border border-emerald-400/20 p-5">
          <div className="flex items-start gap-3">
            <Sparkles size={20} className="text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-wg-text">Your Vehicle is Ready!</h2>
              <p className="text-xs text-wg-text2 mt-0.5">
                Schedule a time below to pick up {label}.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-wg-text">Vehicle Not Ready Yet</h2>
              <p className="text-xs text-wg-text2 mt-1 leading-relaxed">
                {label} is still with us
                {serviceRequest ? ` (${serviceRequest.status.replace(/_/g, ' ')})` : ''}. You can
                schedule your pickup time now and we&apos;ll confirm once it&apos;s ready.{' '}
                {formatDateTime(serviceRequest?.estimated_completion) ? (
                  <>
                    Estimated completion:{' '}
                    <span className="text-[#c8a45c] font-medium">
                      {formatDateTime(serviceRequest?.estimated_completion)}
                    </span>
                  </>
                ) : (
                  <span className="text-wg-muted">
                    No estimated completion time has been set yet.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Real pre-delivery checklist */}
          <div className="mt-4 pt-4 border-t border-wg-border">
            <p className="text-xs font-medium text-wg-text2 mb-3">Pre-Delivery Checklist</p>
            {checklists.length === 0 ? (
              <p className="text-xs text-wg-muted">
                No pre-delivery checklist has been created for this visit yet.
              </p>
            ) : (
              <div className="space-y-4">
                {checklists.map((checklist) => (
                  <div key={checklist.id}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-medium text-wg-text truncate">{checklist.title}</p>
                      <span className="text-[11px] text-wg-muted shrink-0">
                        {checklist.completed_items}/{checklist.total_items}
                      </span>
                    </div>
                    {checklist.items.length === 0 ? (
                      <p className="text-xs text-wg-muted">No items on this checklist yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {checklist.items.map((item) => (
                          <div key={item.id} className="flex items-start gap-2">
                            <div className="mt-0.5 shrink-0">
                              {item.completed ? (
                                <CheckCircle size={14} className="text-emerald-400" />
                              ) : (
                                <Circle size={14} className="text-wg-muted" />
                              )}
                            </div>
                            <span
                              className={`text-xs break-words ${
                                item.completed ? 'text-wg-text' : 'text-wg-muted'
                              }`}
                            >
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <DeliveryScheduler
        orgId={view.customer.organization_id}
        candidateDates={candidateDates}
        locationName={orgName}
      />

      {location}
    </div>
  );
}
