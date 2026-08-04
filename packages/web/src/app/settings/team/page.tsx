import { createServerSupabaseClient } from '@/lib/supabase-server';
import { TeamManagement } from './team-management';

export default async function TeamPage() {
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

  const { data: members } = await supabase
    .from('memberships')
    .select('*, user:users(*)')
    .eq('organization_id', membership.organization_id)
    .order('created_at');

  return (
    <TeamManagement
      members={members ?? []}
      orgId={membership.organization_id}
      currentUserId={user.id}
      currentUserRole={membership.role}
    />
  );
}
