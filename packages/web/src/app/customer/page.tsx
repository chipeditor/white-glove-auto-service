import { Car, CheckCircle, Circle, Clock, Wrench, Sparkles, Phone } from 'lucide-react';
import {
  fetchCustomerOverview,
  customerInitials,
  formatDateTime,
  vehicleName,
  type CustomerVehicleCard,
} from '@/lib/customer-queries';
import { SignedOutNotice, EmptyCard } from './empty-states';

export const dynamic = 'force-dynamic';

function StatusCard({ card }: { card: CustomerVehicleCard }) {
  const { vehicle, serviceRequest, advisor, pipeline, progressPercent } = card;
  const activeStep = pipeline.find((s) => s.state === 'active');
  const estimated = formatDateTime(serviceRequest?.estimated_completion);

  return (
    <div className="space-y-6">
      {/* Vehicle card */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">YOUR VEHICLE</p>
            <h2 className="text-lg font-semibold text-wg-text break-words">{vehicleName(vehicle)}</h2>
            <p className="text-sm text-wg-text2 mt-0.5">
              {vehicle.color ?? 'Color not recorded'}
              {vehicle.vin ? <> &middot; VIN: {vehicle.vin.slice(-6)}</> : null}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c8a45c]/10 flex items-center justify-center shrink-0">
            <Car size={20} className="text-[#c8a45c]" />
          </div>
        </div>

        {serviceRequest ? (
          <>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-wg-text2">Service Progress</span>
                <span className="text-[#c8a45c] font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 bg-wg-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#c8a45c] to-[#d4b76a] rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {activeStep && (
              <div className="mt-4 flex items-start gap-2 bg-wg-blue/10 rounded-lg px-3 py-2">
                <Wrench size={14} className="text-wg-blue mt-0.5 shrink-0" />
                <p className="text-xs text-wg-blue font-medium">
                  Currently: {activeStep.label} &mdash; {activeStep.description}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-wg-text2 mt-4">
            No service request is open for this vehicle right now.
          </p>
        )}
      </div>

      {/* Timeline */}
      {serviceRequest && pipeline.length > 0 && (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <h3 className="text-sm font-semibold text-wg-text mb-1">Service Timeline</h3>
          <p className="text-xs text-wg-text2 mb-4">{serviceRequest.title}</p>
          <div className="space-y-0">
            {pipeline.map((step, i) => {
              const isLast = i === pipeline.length - 1;
              const at = formatDateTime(step.at);
              return (
                <div key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        step.state === 'done'
                          ? 'bg-[#c8a45c]/15'
                          : step.state === 'active'
                            ? 'bg-wg-blue/15 ring-2 ring-wg-blue/30'
                            : 'bg-wg-bg'
                      }`}
                    >
                      {step.state === 'done' ? (
                        <CheckCircle size={14} className="text-[#c8a45c]" />
                      ) : step.state === 'active' ? (
                        <Clock size={14} className="text-wg-blue animate-pulse" />
                      ) : (
                        <Circle size={14} className="text-wg-muted" />
                      )}
                    </div>
                    {!isLast && (
                      <div
                        className={`w-px flex-1 min-h-[28px] ${
                          step.state === 'done' ? 'bg-[#c8a45c]/30' : 'bg-wg-border'
                        }`}
                      />
                    )}
                  </div>

                  <div className={isLast ? 'pb-0' : 'pb-5'}>
                    <p
                      className={`text-sm font-medium ${
                        step.state === 'done'
                          ? 'text-wg-text'
                          : step.state === 'active'
                            ? 'text-wg-blue'
                            : 'text-wg-muted'
                      }`}
                    >
                      {step.label}
                    </p>
                    <p className="text-xs text-wg-text2 mt-0.5">{step.description}</p>
                    {at && <p className="text-xs text-wg-muted mt-0.5">{at}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Advisor */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <h3 className="text-sm font-semibold text-wg-text mb-3">Your Service Advisor</h3>
        {advisor ? (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-[#c8a45c]/10 flex items-center justify-center text-xs font-semibold text-[#c8a45c] shrink-0">
                {customerInitials(advisor.full_name)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-wg-text truncate">{advisor.full_name}</p>
                <p className="text-xs text-wg-text2">Service Advisor</p>
              </div>
            </div>
            {advisor.phone && (
              <a
                href={`tel:${advisor.phone}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#c8a45c]/10 text-[#c8a45c] text-xs font-medium hover:bg-[#c8a45c]/20 transition-colors shrink-0"
              >
                <Phone size={13} />
                Call
              </a>
            )}
          </div>
        ) : (
          <p className="text-xs text-wg-text2">
            No advisor has been assigned to this service request yet.
          </p>
        )}
      </div>

      {/* Estimated completion */}
      <div className="bg-gradient-to-br from-[#c8a45c]/10 to-[#c8a45c]/5 rounded-2xl border border-[#c8a45c]/20 p-5 text-center">
        <Sparkles size={20} className="text-[#c8a45c] mx-auto mb-2" />
        <p className="text-sm font-semibold text-wg-text">Estimated Completion</p>
        {estimated ? (
          <>
            <p className="text-2xl font-bold text-[#c8a45c] mt-1 break-words">{estimated}</p>
            <p className="text-xs text-wg-text2 mt-1">
              We&apos;ll send you a notification when your vehicle is ready
            </p>
          </>
        ) : (
          <p className="text-sm text-wg-text2 mt-2 max-w-xs mx-auto">
            No estimated completion time has been set yet. Your advisor will update this once the
            work is scoped.
          </p>
        )}
      </div>
    </div>
  );
}

export default async function CustomerStatusPage() {
  const overview = await fetchCustomerOverview();

  if (!overview) return <SignedOutNotice />;

  if (overview.cards.length === 0) {
    return (
      <EmptyCard
        title="No vehicles on file"
        body={`We don't have a vehicle registered to ${overview.customer.full_name} yet. Once your vehicle is checked in it will appear here.`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {overview.cards.map((card) => (
        <StatusCard key={card.vehicle.id} card={card} />
      ))}
    </div>
  );
}
