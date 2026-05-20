'use client';

import { use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ClipboardList } from 'lucide-react';

export default function ServiceRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Service Request"
          breadcrumbs={[
            { label: 'Service Requests', href: '/service-requests' },
            { label: `Request ${id}` },
          ]}
        />
        <div className="mt-8">
          <EmptyState
            icon={ClipboardList}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
