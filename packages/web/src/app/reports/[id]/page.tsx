'use client';

import { use } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { BarChart3 } from 'lucide-react';

export default function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Report"
          breadcrumbs={[
            { label: 'Reports', href: '/reports' },
            { label: `Report ${id}` },
          ]}
        />
        <div className="mt-8">
          <EmptyState
            icon={BarChart3}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
