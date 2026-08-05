import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { FileText, ClipboardList, Car } from 'lucide-react';
import { fetchServiceRequests } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const SR_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved', declined: 'Declined', in_progress: 'In Progress',
  quality_control: 'QC', ready_for_delivery: 'Ready', completed: 'Completed',
};

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  const orgId = membership?.organization_id;
  if (!orgId) return null;

  const [srs, inspectionsRes] = await Promise.all([
    fetchServiceRequests(),
    supabase
      .from('inspections')
      .select('*, vehicle:vehicles(year, make, model), technician:users!inspections_technician_id_fkey(full_name)')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const inspections = inspectionsRes.data ?? [];

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="Reports" subtitle="Generate inspection and estimate reports" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={18} className="text-wg-blue" />
              <h2 className="text-base font-medium text-wg-text">Inspection Reports</h2>
            </div>
            {inspections.length === 0 ? (
              <p className="text-sm text-wg-muted">No inspections found</p>
            ) : (
              <div className="space-y-2">
                {inspections.map((insp: Record<string, unknown>) => {
                  const v = insp.vehicle as Record<string, unknown> | null;
                  const tech = insp.technician as Record<string, unknown> | null;
                  return (
                    <Link
                      key={insp.id as string}
                      href={`/reports/inspection/${insp.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-wg-bg2 transition-colors"
                    >
                      <Car size={16} className="text-wg-text2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-wg-text truncate">
                          {v ? `${v.year ?? ''} ${v.make} ${v.model}`.trim() : 'Unknown Vehicle'}
                        </p>
                        <p className="text-xs text-wg-muted">
                          {String(insp.inspection_type ?? '').replace('_', ' ')} — {String(tech?.full_name ?? 'Unassigned')}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        insp.status === 'completed' ? 'bg-wg-green/20 text-wg-green' : 'bg-wg-amber/20 text-wg-amber'
                      }`}>
                        {(insp.status as string)?.replace('_', ' ')}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileText size={18} className="text-wg-green" />
              <h2 className="text-base font-medium text-wg-text">Estimate Reports</h2>
            </div>
            {srs.length === 0 ? (
              <p className="text-sm text-wg-muted">No service requests found</p>
            ) : (
              <div className="space-y-2">
                {srs.map((sr) => {
                  const v = sr.vehicle;
                  return (
                    <Link
                      key={sr.id}
                      href={`/reports/estimate/${sr.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-wg-bg2 transition-colors"
                    >
                      <FileText size={16} className="text-wg-text2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-wg-text truncate">{sr.title}</p>
                        <p className="text-xs text-wg-muted">
                          {v ? `${v.year ?? ''} ${v.make} ${v.model}`.trim() : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        sr.status === 'completed' ? 'bg-wg-green/20 text-wg-green' :
                        sr.status === 'approved' ? 'bg-wg-blue/20 text-wg-blue' :
                        'bg-wg-amber/20 text-wg-amber'
                      }`}>
                        {SR_STATUS_LABELS[sr.status] ?? sr.status}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
