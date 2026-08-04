import Link from 'next/link';
import { Car, CheckCircle, Clock, AlertCircle, Plus, DollarSign, Users, Wrench, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Button } from '@/components/ui/Button';
import { VehicleTable } from '@/components/vehicle/VehicleCard';
import { fetchVehicles, fetchDashboardStats, getCurrentUser } from '@/lib/queries';
import type { DashboardStats } from '@/lib/queries';

const SR_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved',
  declined: 'Declined',
  in_progress: 'In Progress',
  quality_control: 'QC',
  ready_for_delivery: 'Ready',
  completed: 'Completed',
};

const SR_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-wg-muted/30',
  submitted: 'bg-wg-blue/20',
  awaiting_customer_approval: 'bg-wg-amber/20',
  approved: 'bg-wg-green/20',
  declined: 'bg-wg-red/20',
  in_progress: 'bg-wg-blue/30',
  quality_control: 'bg-purple-500/20',
  ready_for_delivery: 'bg-wg-green/30',
  completed: 'bg-wg-green/10',
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function StatusPipeline({ stats }: { stats: DashboardStats }) {
  const pipeline = [
    'submitted', 'awaiting_customer_approval', 'approved', 'in_progress',
    'quality_control', 'ready_for_delivery', 'completed',
  ];
  const total = pipeline.reduce((sum, s) => sum + (stats.sr_statuses[s] || 0), 0);

  return (
    <div className="bg-wg-card rounded-xl border border-wg-border p-5">
      <h3 className="text-sm font-medium text-wg-text mb-4">Service Request Pipeline</h3>
      {total === 0 ? (
        <p className="text-sm text-wg-muted">No active service requests</p>
      ) : (
        <>
          <div className="flex rounded-lg overflow-hidden h-8 mb-4">
            {pipeline.map((status) => {
              const count = stats.sr_statuses[status] || 0;
              if (count === 0) return null;
              const pct = (count / total) * 100;
              return (
                <div
                  key={status}
                  className={`${SR_STATUS_COLORS[status]} flex items-center justify-center min-w-[28px] transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${SR_STATUS_LABELS[status]}: ${count}`}
                >
                  <span className="text-[10px] font-medium text-wg-text truncate px-1">{count}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {pipeline.map((status) => {
              const count = stats.sr_statuses[status] || 0;
              if (count === 0) return null;
              return (
                <div key={status} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${SR_STATUS_COLORS[status]}`} />
                  <span className="text-xs text-wg-text2">{SR_STATUS_LABELS[status]} ({count})</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function RevenueCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-wg-card rounded-xl border border-wg-border p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-wg-text2">Approved Revenue</p>
            <p className="text-2xl font-semibold text-wg-green mt-1">{formatCurrency(stats.revenue_approved)}</p>
          </div>
          <div className="p-2 bg-wg-green/10 rounded-lg">
            <DollarSign size={20} className="text-wg-green" />
          </div>
        </div>
      </div>
      <div className="bg-wg-card rounded-xl border border-wg-border p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-wg-text2">Pending Estimates</p>
            <p className="text-2xl font-semibold text-wg-amber mt-1">{formatCurrency(stats.revenue_pending)}</p>
          </div>
          <div className="p-2 bg-wg-amber/10 rounded-lg">
            <FileText size={20} className="text-wg-amber" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ stats }: { stats: DashboardStats }) {
  if (stats.recent_activity.length === 0) {
    return (
      <div className="bg-wg-card rounded-xl border border-wg-border p-5">
        <h3 className="text-sm font-medium text-wg-text mb-3">Recent Activity</h3>
        <p className="text-sm text-wg-muted">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-wg-card rounded-xl border border-wg-border p-5">
      <h3 className="text-sm font-medium text-wg-text mb-3">Recent Activity</h3>
      <div className="space-y-3">
        {stats.recent_activity.map((item) => (
          <Link
            key={item.id}
            href={`/service-requests/${item.id}`}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-wg-bg2 transition-colors"
          >
            <div className="p-1.5 bg-wg-bg2 rounded-md">
              <Wrench size={14} className="text-wg-text2" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-wg-text truncate">{item.title}</p>
              {item.vehicle && (
                <p className="text-xs text-wg-muted truncate">{item.vehicle}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SR_STATUS_COLORS[item.status] || 'bg-wg-muted/20'} text-wg-text2`}>
                {SR_STATUS_LABELS[item.status] || item.status}
              </span>
              <span className="text-xs text-wg-muted">{timeAgo(item.date)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

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

        {stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
              <StatCard
                label="Vehicles In Service"
                value={stats.vehicles_in_service}
                icon={Car}
              />
              <StatCard
                label="Active Work Orders"
                value={stats.active_service_requests}
                icon={Wrench}
              />
              <StatCard
                label="Awaiting Approval"
                value={stats.awaiting_approval + stats.pending_approvals}
                icon={Clock}
              />
              <StatCard
                label="Total Customers"
                value={stats.total_customers}
                icon={Users}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <RevenueCards stats={stats} />
              <StatusPipeline stats={stats} />
            </div>

            <div className="mt-4">
              <RecentActivity stats={stats} />
            </div>
          </>
        )}

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-wg-text">Recent Vehicles</h2>
            <Link href="/vehicles">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <VehicleTable vehicles={vehicles.slice(0, 5)} />
        </div>
      </div>
    </AppShell>
  );
}
