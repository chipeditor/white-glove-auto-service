'use client';

import { use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Truck } from 'lucide-react';

export default function DeliveryChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Delivery Checklist"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: `Delivery ${id}` },
          ]}
        />
        <div className="mt-8">
          <EmptyState
            icon={Truck}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
