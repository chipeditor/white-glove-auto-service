import { createServerSupabaseClient } from '@/lib/supabase-server';
import { OrganizationForm } from './organization-form';

export default async function OrganizationSettingsPage() {
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

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', membership.organization_id)
    .single();

  if (!org) return null;

  return <OrganizationForm org={org} />;
}
