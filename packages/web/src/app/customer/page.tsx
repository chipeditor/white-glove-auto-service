'use client';

import { Car, CheckCircle, Circle, Clock, Wrench, Sparkles, Phone } from 'lucide-react';

const VEHICLE = {
  year: 2015,
  make: 'Chevrolet',
  model: 'Corvette',
  trim: 'Z51',
  color: 'Torch Red',
  vin: '1G1YB2D73F5100001',
};

const PIPELINE = [
  { key: 'intake', label: 'Vehicle Received', description: 'Your vehicle has been checked in', time: 'May 17, 10:15 AM', done: true },
  { key: 'inspection', label: 'Intake Inspection', description: 'Full exterior and interior inspection completed', time: 'May 17, 11:30 AM', done: true },
  { key: 'approval', label: 'Your Approval', description: 'You approved the recommended service plan', time: 'May 17, 2:00 PM', done: true },
  { key: 'service', label: 'In Service', description: '7 of 12 tasks completed', time: 'Started May 17, 3:00 PM', done: false, active: true },
  { key: 'quality', label: 'Quality Check', description: 'Final inspection before delivery', done: false },
  { key: 'ready', label: 'Ready for Delivery', description: 'We\'ll notify you to schedule pickup', done: false },
];

const ADVISOR = {
  name: 'Lisa Chen',
  role: 'Service Advisor',
  phone: '(555) 123-4567',
};

export default function CustomerStatusPage() {
  const completedCount = PIPELINE.filter((s) => s.done).length;
  const totalSteps = PIPELINE.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const activeStep = PIPELINE.find((s) => s.active);

  return (
    <div className="space-y-6">
      {/* Vehicle card */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">YOUR VEHICLE</p>
            <h2 className="text-lg font-semibold text-wg-text">
              {VEHICLE.year} {VEHICLE.make} {VEHICLE.model} {VEHICLE.trim}
            </h2>
            <p className="text-sm text-wg-text2 mt-0.5">{VEHICLE.color} &middot; VIN: {VEHICLE.vin.slice(-6)}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#c8a45c]/10 flex items-center justify-center">
            <Car size={20} className="text-[#c8a45c]" />
          </div>
        </div>

        {/* Progress bar */}
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
          <div className="mt-4 flex items-center gap-2 bg-wg-blue/10 rounded-lg px-3 py-2">
            <Wrench size={14} className="text-wg-blue" />
            <p className="text-xs text-wg-blue font-medium">
              Currently: {activeStep.label} &mdash; {activeStep.description}
            </p>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <h3 className="text-sm font-semibold text-wg-text mb-4">Service Timeline</h3>
        <div className="space-y-0">
          {PIPELINE.map((step, i) => {
            const isLast = i === PIPELINE.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                {/* Line + dot */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    step.done
                      ? 'bg-[#c8a45c]/15'
                      : step.active
                        ? 'bg-wg-blue/15 ring-2 ring-wg-blue/30'
                        : 'bg-wg-bg'
                  }`}>
                    {step.done ? (
                      <CheckCircle size={14} className="text-[#c8a45c]" />
                    ) : step.active ? (
                      <Clock size={14} className="text-wg-blue animate-pulse" />
                    ) : (
                      <Circle size={14} className="text-wg-muted" />
                    )}
                  </div>
                  {!isLast && (
                    <div className={`w-px flex-1 min-h-[28px] ${
                      step.done ? 'bg-[#c8a45c]/30' : 'bg-wg-border'
                    }`} />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-5 ${isLast ? 'pb-0' : ''}`}>
                  <p className={`text-sm font-medium ${
                    step.done
                      ? 'text-wg-text'
                      : step.active
                        ? 'text-wg-blue'
                        : 'text-wg-muted'
                  }`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-wg-text2 mt-0.5">{step.description}</p>
                  {step.time && (
                    <p className="text-xs text-wg-muted mt-0.5">{step.time}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Advisor card */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <h3 className="text-sm font-semibold text-wg-text mb-3">Your Service Advisor</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#c8a45c]/10 flex items-center justify-center text-xs font-semibold text-[#c8a45c]">
              LC
            </div>
            <div>
              <p className="text-sm font-medium text-wg-text">{ADVISOR.name}</p>
              <p className="text-xs text-wg-text2">{ADVISOR.role}</p>
            </div>
          </div>
          <a
            href={`tel:${ADVISOR.phone}`}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#c8a45c]/10 text-[#c8a45c] text-xs font-medium hover:bg-[#c8a45c]/20 transition-colors"
          >
            <Phone size={13} />
            Call
          </a>
        </div>
      </div>

      {/* Estimated completion */}
      <div className="bg-gradient-to-br from-[#c8a45c]/10 to-[#c8a45c]/5 rounded-2xl border border-[#c8a45c]/20 p-5 text-center">
        <Sparkles size={20} className="text-[#c8a45c] mx-auto mb-2" />
        <p className="text-sm font-semibold text-wg-text">Estimated Completion</p>
        <p className="text-2xl font-bold text-[#c8a45c] mt-1">Tomorrow, 4:00 PM</p>
        <p className="text-xs text-wg-text2 mt-1">We&apos;ll send you a notification when your vehicle is ready</p>
      </div>
    </div>
  );
}
