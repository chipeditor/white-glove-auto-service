'use client';

import { use, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { AffiliateCard } from '@/components/ui/AffiliateCard';
import { ChecklistProgress, ChecklistItemRow } from '@/components/checklist/ChecklistCard';
import { InspectionSectionCard } from '@/components/inspection/InspectionSectionCard';
import {
  MOCK_VEHICLES_WITH_CUSTOMERS,
  MOCK_SERVICE_REQUESTS,
  MOCK_INSPECTIONS,
  MOCK_INSPECTION_SECTIONS,
  MOCK_SERVICE_CHECKLIST,
  MOCK_AFFILIATE,
} from '@/lib/mock-data';
import { Car, ChevronDown } from 'lucide-react';

const TABS = ['Overview', 'Intake', 'Inspections', 'Service Request', 'Checklists', 'Files', 'History'];

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('Overview');
  const vehicle = MOCK_VEHICLES_WITH_CUSTOMERS.find((v) => v.id === id) ?? MOCK_VEHICLES_WITH_CUSTOMERS[0];
  const serviceRequest = MOCK_SERVICE_REQUESTS[0];
  const inspections = MOCK_INSPECTIONS;
  const checklist = MOCK_SERVICE_CHECKLIST;

  return (
    <AppShell>
      <div className="p-8">
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

        <div className="flex items-start gap-6 mt-4">
          <div className="w-40 h-28 bg-wg-card rounded-xl border border-wg-border flex items-center justify-center">
            <Car size={40} className="text-wg-muted" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-wg-text">
                {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
              </h1>
              <StatusBadge status={vehicle.status} />
            </div>
            <p className="text-sm text-wg-text2 mt-1">VIN: {vehicle.vin}</p>
            <div className="flex gap-6 mt-3 text-sm">
              <div>
                <span className="text-wg-muted">Mileage</span>
                <p className="text-wg-text font-medium">{vehicle.mileage?.toLocaleString()} mi</p>
              </div>
              <div>
                <span className="text-wg-muted">Color</span>
                <p className="text-wg-text font-medium">{vehicle.color}</p>
              </div>
              <div>
                <span className="text-wg-muted">Engine</span>
                <p className="text-wg-text font-medium">{vehicle.engine}</p>
              </div>
              <div>
                <span className="text-wg-muted">Transmission</span>
                <p className="text-wg-text font-medium">{vehicle.transmission}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-6 border-b border-wg-border">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
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
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div className="col-span-2 space-y-6">
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-1">Service Request</h3>
                <p className="text-sm text-wg-text2">{serviceRequest.title}</p>
                <a href="#" className="text-sm text-wg-blue mt-2 inline-block hover:underline">
                  View Details →
                </a>
              </div>

              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-1">Customer</h3>
                <p className="text-sm text-wg-text">{vehicle.customer?.full_name}</p>
                <p className="text-xs text-wg-text2">{vehicle.customer?.email}</p>
                <p className="text-xs text-wg-text2">{vehicle.customer?.phone}</p>
                <a href="#" className="text-sm text-wg-blue mt-2 inline-block hover:underline">
                  View Profile →
                </a>
              </div>

              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-3">Status</h3>
                <div className="flex items-center gap-4">
                  {['Intake Completed', 'In Service', 'Quality Control', 'Ready for Delivery', 'Delivery'].map(
                    (step, i) => {
                      const completed = i < 2;
                      const active = i === 1;
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
                          {i < 4 && <div className="w-8 h-px bg-wg-border" />}
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
                <ChecklistProgress
                  completed={checklist.completed_items}
                  total={checklist.total_items}
                />
                <div className="mt-4 space-y-2">
                  {inspections.map((insp) => (
                    <div key={insp.id} className="flex items-center justify-between text-sm">
                      <span className="text-wg-text2 capitalize">{insp.type} Inspection</span>
                      <StatusBadge status={insp.status} />
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-wg-text2">Service Checklist</span>
                    <StatusBadge status="in_progress" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-wg-text2">Quality Control</span>
                    <StatusBadge status="not_started" />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-wg-text2">Delivery Checklist</span>
                    <StatusBadge status="not_started" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-wg-text">Affiliate Recommendations</h3>
                  <div className="flex gap-1">
                    <button className="p-1 text-wg-muted hover:text-wg-text">‹</button>
                    <button className="p-1 text-wg-muted hover:text-wg-text">›</button>
                  </div>
                </div>
                <AffiliateCard recommendation={MOCK_AFFILIATE} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Inspections' && (
          <div className="grid grid-cols-2 gap-6 mt-6">
            {MOCK_INSPECTION_SECTIONS.map((section) => (
              <InspectionSectionCard
                key={section.id}
                name={section.name}
                items={section.items}
                completedCount={section.items.filter((i) => i.passed !== null).length}
                totalCount={section.items.length}
              />
            ))}
          </div>
        )}

        {activeTab === 'Checklists' && (
          <div className="max-w-2xl mt-6">
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
          </div>
        )}

        {(activeTab === 'Intake' || activeTab === 'Service Request' || activeTab === 'Files' || activeTab === 'History') && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 bg-wg-card rounded-xl flex items-center justify-center mx-auto mb-3">
                <Car size={24} className="text-wg-muted" />
              </div>
              <p className="text-sm text-wg-text2">{activeTab} view coming soon</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
