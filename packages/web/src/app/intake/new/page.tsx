'use client';

import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Button } from '@/components/ui/Button';
import { X, MoreVertical, ScanLine } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { label: 'Vehicle', key: 'vehicle' },
  { label: 'Customer', key: 'customer' },
  { label: 'Service', key: 'service' },
  { label: 'Inspection', key: 'inspection' },
];

export default function NewIntakePage() {
  const [step, setStep] = useState(0);

  const stepData = STEPS.map((s, i) => ({
    ...s,
    completed: i < step,
    active: i === step,
  }));

  return (
    <AppShell>
      <div className="p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-wg-muted hover:text-wg-text transition-colors">
              <X size={20} />
            </Link>
            <h1 className="text-lg font-semibold text-wg-text">New Intake</h1>
          </div>
          <button className="p-2 text-wg-muted hover:text-wg-text transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        <ProgressStepper steps={stepData} className="mb-8" />

        {step === 0 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Vehicle Information</h2>

            <button className="flex items-center gap-2 px-4 py-3 w-full bg-wg-bg2 border border-wg-border rounded-lg text-sm text-wg-text2 hover:border-wg-blue/30 transition-colors">
              <ScanLine size={18} />
              Scan VIN
            </button>

            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">VIN</label>
              <input
                defaultValue="1G1YB2D73F5100001"
                className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Year</label>
                <input
                  defaultValue="2015"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Make</label>
                <input
                  defaultValue="Chevrolet"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Model</label>
                <input
                  defaultValue="Corvette"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Trim</label>
                <select className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50 appearance-none">
                  <option>Z51</option>
                  <option>Z06</option>
                  <option>ZR1</option>
                  <option>Grand Sport</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Color</label>
                <input
                  defaultValue="Torch Red"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Mileage</label>
                <input
                  defaultValue="5,312"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">License Plate</label>
                <input
                  defaultValue="ABC1234"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">State</label>
                <input
                  defaultValue="CA"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Customer Information</h2>
            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Full Name</label>
              <input
                defaultValue="Mike Johnson"
                className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Email</label>
                <input
                  defaultValue="mike.johnson@email.com"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Phone</label>
                <input
                  defaultValue="(555) 123-4567"
                  className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Service Details</h2>
            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Service Type</label>
              <select className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50 appearance-none">
                <option>Performance Inspection</option>
                <option>Routine Service</option>
                <option>Cosmetic Repair</option>
                <option>Pre-Purchase Inspection</option>
                <option>Delivery Verification</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                defaultValue="Full performance inspection including engine, brakes, suspension, and delivery prep."
                className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50 resize-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Initial Inspection</h2>
            <p className="text-sm text-wg-text2">
              Begin the intake inspection after saving. You&apos;ll document the vehicle&apos;s current condition across
              exterior, interior, engine, wheels, and glass sections.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Exterior Front', 'Exterior Rear', 'Driver Side', 'Passenger Side', 'Wheels & Tires', 'Glass & Lights', 'Interior', 'Engine Bay', 'Warning Lights', 'Final Notes'].map(
                (section) => (
                  <div key={section} className="flex items-center gap-2 p-3 bg-wg-bg2 rounded-lg border border-wg-border">
                    <div className="w-4 h-4 rounded-full border border-wg-border-light" />
                    <span className="text-sm text-wg-text2">{section}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}>
            {step === STEPS.length - 1 ? 'Start Inspection' : 'Continue'}
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
