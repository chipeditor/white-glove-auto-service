'use client';

import { use, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { InspectionSectionCard } from '@/components/inspection/InspectionSectionCard';
import { MOCK_INSPECTION_SECTIONS, MOCK_MECHANICAL_ITEMS } from '@/lib/mock-data';

const SECTION_TABS = ['Exterior', 'Interior', 'Engine Bay', 'Wheels', 'Glass'];

export default function InspectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState('Exterior');

  return (
    <AppShell>
      <div className="p-8">
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
      </div>
    </AppShell>
  );
}
