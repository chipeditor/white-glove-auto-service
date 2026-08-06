import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { fetchCustomers } from '@/lib/queries';
import { CustomerTable } from './customer-table';

export default async function CustomersPage() {
  const customers = await fetchCustomers();

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Customers"
          subtitle={`${customers.length} total customers`}
          actions={
            <Link href="/customers/new">
              <Button>
                <Plus size={16} />
                Add Customer
              </Button>
            </Link>
          }
        />

        <div className="mt-6">
          <CustomerTable customers={customers} />
        </div>
      </div>
    </AppShell>
  );
}
