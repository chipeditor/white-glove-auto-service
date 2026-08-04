import Link from 'next/link';
import { Car, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { VehicleTable } from '@/components/vehicle/VehicleCard';
import { fetchVehicles, fetchDashboardStats, getCurrentUser } from '@/lib/queries';

export default async function DashboardPage() {
  const [vehicles, stats, user] = await Promise.all([
    fetchVehicles(),
    fetchDashboardStats(),
    getCurrentUser(),
  ]);

  const greeting = user?.full_name
    ? `Welcome back, ${user.full_name.split(' ')[0]}.`
    : 'Welcome back.';

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Dashboard"
          subtitle={greeting}
          actions={
            <Link href="/intake/new">
              <Button>
                <Plus size={16} />
                New Intake
              </Button>
            </Link>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <StatCard
            label="Vehicles In Service"
            value={stats?.vehicles_in_service ?? 0}
            icon={Car}
          />
          <StatCard
            label="Ready for Delivery"
            value={stats?.ready_for_delivery ?? 0}
            icon={CheckCircle}
          />
          <StatCard
            label="Awaiting Approval"
            value={stats?.awaiting_approval ?? 0}
            icon={Clock}
          />
          <StatCard
            label="Completed This Week"
            value={stats?.completed_this_week ?? 0}
            icon={AlertCircle}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-wg-text">Recent Vehicles</h2>
            <Link href="/vehicles">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <VehicleTable vehicles={vehicles} />
        </div>
      </div>
    </AppShell>
  );
}
