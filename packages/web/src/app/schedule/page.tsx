import { AppShell } from '@/components/layout/AppShell';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ScheduleCalendar } from './schedule-calendar';

export default async function SchedulePage() {
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

  if (!membership) return null;

  const orgId = membership.organization_id;

  const { data: srs } = await supabase
    .from('service_requests')
    .select('id, title, status, estimated_completion, created_at, technician_id, vehicle:vehicles(year, make, model), technician:users!service_requests_technician_id_fkey(id, full_name), customer:customers(full_name)')
    .eq('organization_id', orgId)
    .not('status', 'in', '("completed","declined")')
    .order('estimated_completion', { ascending: true, nullsFirst: false });

  const { data: technicians } = await supabase
    .from('memberships')
    .select('user:users(id, full_name)')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .in('role', ['technician', 'service_advisor', 'shop_admin']);

  const techList = (technicians ?? [])
    .map((m: Record<string, unknown>) => m.user as { id: string; full_name: string } | null)
    .filter(Boolean) as { id: string; full_name: string }[];

  return (
    <AppShell>
      <div className="p-8">
        <ScheduleCalendar
          serviceRequests={(srs ?? []) as unknown as { id: string; title: string; status: string; estimated_completion: string | null; created_at: string; technician_id: string | null; vehicle: { year: number | null; make: string; model: string } | null; technician: { id: string; full_name: string } | null; customer: { full_name: string } | null }[]}
          technicians={techList}
        />
      </div>
    </AppShell>
  );
}
