import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { getCurrentUser } from '@/lib/queries';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { MyWorkView } from './my-work-view';

export default async function MyWorkPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const supabase = await createServerSupabaseClient();

  const { data: jobs } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*)')
    .eq('technician_id', currentUser.id)
    .not('status', 'eq', 'completed')
    .not('status', 'eq', 'declined')
    .order('priority', { ascending: false })
    .order('promised_at', { ascending: true });

  return (
    <AppShell>
      <div className="p-8">
        <PageHeader title="My Work" />
        <div className="mt-6">
          <MyWorkView jobs={jobs ?? []} />
        </div>
      </div>
    </AppShell>
  );
}
