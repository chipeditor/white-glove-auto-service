import Link from 'next/link';
import { Car, CheckCircle, Clock, AlertCircle, Plus, DollarSign, Users, Wrench, FileText } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
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

function GlassStatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: typeof Car; color?: string }) {
  return (
    <div className="glass-stat p-3 sm:p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs sm:text-sm text-white/50">{label}</p>
          <p className={`text-2xl sm:text-3xl font-semibold mt-0.5 sm:mt-1 ${color || 'text-white/90'}`}>{value}</p>
        </div>
        <div className="p-2 sm:p-2.5 rounded-xl bg-white/[0.04]">
          <Icon size={18} className="text-white/40 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}

function StatusPipeline({ stats }: { stats: DashboardStats }) {
  const pipeline = [
    'submitted', 'awaiting_customer_approval', 'approved', 'in_progress',
    'quality_control', 'ready_for_delivery', 'completed',
  ];
  const total = pipeline.reduce((sum, s) => sum + (stats.sr_statuses[s] || 0), 0);

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-white/80 mb-4">Service request pipeline</h3>
      {total === 0 ? (
        <p className="text-sm text-white/30">No active service requests</p>
      ) : (
        <>
          <div className="flex rounded-lg overflow-hidden h-8 mb-4 bg-white/[0.03]">
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
                  <span className="text-[10px] font-medium text-white/70 truncate px-1">{count}</span>
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
                  <span className="text-xs text-white/45">{SR_STATUS_LABELS[status]} ({count})</span>
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
      <div className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50">Approved Revenue</p>
            <p className="text-2xl font-semibold text-wg-green mt-1">{formatCurrency(stats.revenue_approved)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-wg-green/[0.08]">
            <DollarSign size={20} className="text-wg-green/70" />
          </div>
        </div>
      </div>
      <div className="glass-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-white/50">Pending Estimates</p>
            <p className="text-2xl font-semibold text-wg-amber mt-1">{formatCurrency(stats.revenue_pending)}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-wg-amber/[0.08]">
            <FileText size={20} className="text-wg-amber/70" />
          </div>
        </div>
      </div>
    </div>
  );
}

function RecentActivity({ stats }: { stats: DashboardStats }) {
  if (stats.recent_activity.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-medium text-white/80 mb-3">Recent activity</h3>
        <p className="text-sm text-white/30">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-medium text-white/80 mb-3">Recent activity</h3>
      <div className="space-y-1">
        {stats.recent_activity.map((item) => (
          <Link
            key={item.id}
            href={`/service-requests/${item.id}`}
            className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="p-1.5 bg-white/[0.04] rounded-lg hidden sm:block">
              <Wrench size={14} className="text-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/85 truncate">{item.title}</p>
              <div className="flex items-center gap-2">
                {item.vehicle && (
                  <span className="text-xs text-white/35 truncate">{item.vehicle}</span>
                )}
                {item.technician && (
                  <>
                    <span className="text-xs text-white/20">·</span>
                    <span className="text-xs text-white/45 truncate">{item.technician}</span>
                  </>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 shrink-0">
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${SR_STATUS_COLORS[item.status] || 'bg-wg-muted/20'} text-white/60`}>
                {SR_STATUS_LABELS[item.status] || item.status}
              </span>
              <span className="text-[10px] sm:text-xs text-white/30">{timeAgo(item.date)}</span>
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
      <div className="p-4 sm:p-8 glass-page-bg min-h-screen">
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
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-6">
              <GlassStatCard label="Vehicles In Service" value={stats.vehicles_in_service} icon={Car} />
              <GlassStatCard label="Active Work Orders" value={stats.active_service_requests} icon={Wrench} />
              <GlassStatCard label="Awaiting Approval" value={stats.awaiting_approval + stats.pending_approvals} icon={Clock} />
              <GlassStatCard label="Total Customers" value={stats.total_customers} icon={Users} />
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
            <h2 className="text-lg font-medium text-white/85">Recent Vehicles</h2>
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
