'use client';

import { use, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { InspectionSectionCard } from '@/components/inspection/InspectionSectionCard';
import { DamageMarker } from '@/components/ui/DamageMarker';
import { FileUpload } from '@/components/ui/FileUpload';
import { MOCK_INSPECTION_SECTIONS, MOCK_MECHANICAL_ITEMS } from '@/lib/mock-data';

const SECTION_TABS = ['Damage Map', 'Photos', 'Exterior', 'Interior', 'Engine Bay', 'Wheels', 'Glass'];

interface DamagePoint {
  id: string;
  x: number;
  y: number;
  severity: 'minor' | 'moderate' | 'severe';
  note: string;
}

export default function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('Damage Map');
  const [damageMarkers, setDamageMarkers] = useState<DamagePoint[]>([]);

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Intake Inspection"
          breadcrumbs={[
            { label: 'Vehicles', href: '/vehicles' },
            { label: '2015 Chevrolet Corvette Z51', href: `/vehicles/${id}` },
            { label: 'Intake Inspection' },
          ]}
        />

        <div className="flex gap-2 mt-6 mb-6">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-wg-blue/10 text-wg-blue'
                  : 'text-wg-text2 hover:bg-wg-card border border-wg-border'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Damage Map' ? (
          <div className="max-w-2xl">
            <div className="bg-wg-card rounded-xl border border-wg-border p-5">
              <h3 className="text-sm font-medium text-wg-text mb-4">Vehicle Damage Diagram</h3>
              <DamageMarker
                vehicleType="sedan"
                markers={damageMarkers}
                onChange={setDamageMarkers}
              />
            </div>
          </div>
        ) : activeTab === 'Photos' ? (
          <div className="max-w-3xl">
            <div className="bg-wg-card rounded-xl border border-wg-border p-5">
              <h3 className="text-sm font-medium text-wg-text mb-4">Inspection Photos</h3>
              <FileUpload
                vehicleId={id}
                organizationId="a0000000-0000-0000-0000-000000000001"
                inspectionId={id}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            {MOCK_INSPECTION_SECTIONS.map((section) => (
              <InspectionSectionCard
                key={section.id}
                name={section.name}
                items={section.items}
                completedCount={section.items.filter((i) => i.passed !== null).length}
                totalCount={section.items.length}
              />
            ))}
            {MOCK_MECHANICAL_ITEMS.map((group) => (
              <InspectionSectionCard
                key={group.category}
                name={group.category}
                items={group.items}
                completedCount={group.items.filter((i) => i.passed !== null).length}
                totalCount={group.items.length}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
