import { createServerSupabaseClient } from '@/lib/supabase-server';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { AppointmentsList } from './appointments-list';

export default async function AppointmentsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: appointments } = await supabase
    .from('appointments')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <PageHeader
          title="Appointments"
          breadcrumbs={[{ label: 'Appointments' }]}
        />
        <AppointmentsList
          appointments={appointments ?? []}
          orgId={membership.organization_id}
        />
      </div>
    </AppShell>
  );
}
