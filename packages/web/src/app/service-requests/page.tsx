import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { fetchServiceRequests } from '@/lib/queries';
import { ServiceRequestTable } from './service-request-table';

export default async function ServiceRequestsPage() {
  const serviceRequests = await fetchServiceRequests();

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Service Requests"
          subtitle={`${serviceRequests.length} total requests`}
          actions={
            <Link href="/service-requests/new">
              <Button>
                <Plus size={16} />
                New Request
              </Button>
            </Link>
          }
        />

        <div className="mt-6">
          <ServiceRequestTable serviceRequests={serviceRequests} />
        </div>
      </div>
    </AppShell>
  );
}
