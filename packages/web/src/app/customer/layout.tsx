import { getCustomerContext, customerInitials } from '@/lib/customer-queries';
import { CustomerNav } from './nav';

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const context = await getCustomerContext();
  const fullName = context?.customer.full_name ?? null;

  return (
    <div className="min-h-screen bg-wg-bg">
      <CustomerNav initials={customerInitials(fullName)} fullName={fullName} />
      <main className="max-w-3xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
