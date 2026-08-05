import { createServerSupabaseClient } from '@/lib/supabase-server';
import { CannedJobsManager } from './canned-jobs-manager';

export default async function CannedJobsPage() {
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

  const { data: jobs } = await supabase
    .from('canned_jobs')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('sort_order');

  return (
    <CannedJobsManager
      jobs={jobs ?? []}
      orgId={membership.organization_id}
      isAdmin={['super_admin', 'shop_admin'].includes(membership.role)}
    />
  );
}
