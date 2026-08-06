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
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Service Requests"
          subtitle={`${serviceRequests.length} total requests`}
          actions={
            // A service request needs a vehicle, so intake is the creation path.
            <Link href="/intake/new">
              <Button>
                <Plus size={16} />
                New Intake
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
