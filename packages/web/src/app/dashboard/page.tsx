'use client';

import Link from 'next/link';
import { Car, CheckCircle, Clock, AlertCircle, Plus } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { VehicleTable } from '@/components/vehicle/VehicleCard';
import { MOCK_VEHICLES_WITH_CUSTOMERS, DASHBOARD_STATS } from '@/lib/mock-data';

export default function DashboardPage() {
  const stats = DASHBOARD_STATS;

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back, John."
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
            value={stats.vehicles_in_service}
            delta={stats.vehicles_in_service_delta}
            icon={Car}
          />
          <StatCard
            label="Ready for Delivery"
            value={stats.ready_for_delivery}
            delta={stats.ready_for_delivery_delta}
            icon={CheckCircle}
          />
          <StatCard
            label="Awaiting Approval"
            value={stats.awaiting_approval}
            delta={stats.awaiting_approval_delta}
            deltaLabel="0 from yesterday"
            icon={Clock}
          />
          <StatCard
            label="Completed This Week"
            value={stats.completed_this_week}
            delta={stats.completed_this_week_delta}
            deltaLabel="4 from last week"
            icon={AlertCircle}
          />
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-wg-text">Recent Vehicles</h2>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <VehicleTable vehicles={MOCK_VEHICLES_WITH_CUSTOMERS} />
        </div>
      </div>
    </AppShell>
  );
}
