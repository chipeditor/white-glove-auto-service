'use client';

import { useState } from 'react';
import { Car } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AffiliateCard } from '@/components/ui/AffiliateCard';
import { ChecklistProgress, ChecklistItemRow } from '@/components/checklist/ChecklistCard';
import type {
  VehicleWithCustomer,
  Inspection,
  Checklist,
  ChecklistItem,
  AffiliateRecommendation,
  ServiceRequest,
} from '@/shared/types';

const TABS = ['Overview', 'Intake', 'Inspections', 'Service Request', 'Checklists', 'Files', 'History'];

interface Props {
  vehicle: VehicleWithCustomer;
  inspections: Inspection[];
  checklists: (Checklist & { items: ChecklistItem[] })[];
  affiliates: AffiliateRecommendation[];
  serviceRequests: ServiceRequest[];
}

export function VehicleDetailTabs({ vehicle, inspections, checklists, affiliates, serviceRequests }: Props) {
  const [activeTab, setActiveTab] = useState('Overview');
  const checklist = checklists[0];
  const serviceRequest = serviceRequests[0];

  return (
    <>
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
            {serviceRequest && (
              <div className="bg-wg-card rounded-xl border border-wg-border p-5">
                <h3 className="text-sm font-medium text-wg-text mb-1">Service Request</h3>
                <p className="text-sm text-wg-text2">{serviceRequest.title}</p>
                <a href={`/service-requests/${serviceRequest.id}`} className="text-sm text-wg-blue mt-2 inline-block hover:underline">
                  View Details →
                </a>
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
              {checklist && (
                <ChecklistProgress
                  completed={checklist.completed_items}
                  total={checklist.total_items}
                />
              )}
              <div className="mt-4 space-y-2">
                {inspections.map((insp) => (
                  <div key={insp.id} className="flex items-center justify-between text-sm">
                    <span className="text-wg-text2 capitalize">{insp.type} Inspection</span>
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

      {activeTab === 'Checklists' && checklist && (
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

      {(activeTab === 'Intake' || activeTab === 'Inspections' || activeTab === 'Service Request' || activeTab === 'Files' || activeTab === 'History') && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="w-12 h-12 bg-wg-card rounded-xl flex items-center justify-center mx-auto mb-3">
              <Car size={24} className="text-wg-muted" />
            </div>
            <p className="text-sm text-wg-text2">{activeTab} view coming soon</p>
          </div>
        </div>
      )}
    </>
  );
}
