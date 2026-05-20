import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Settings } from 'lucide-react';

export default function OrganizationSettingsPage() {
  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Organization Settings" subtitle="Manage your shop profile and preferences" />
        <div className="mt-8">
          <EmptyState
            icon={Settings}
            title="Coming Soon"
            description="This feature is under development."
          />
        </div>
      </div>
    </AppShell>
  );
}
