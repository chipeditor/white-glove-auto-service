import { createServerSupabaseClient } from '@/lib/supabase-server';
import { ActivityTimeline } from '@/components/ui/ActivityTimeline';
import { EmptyState } from '@/components/ui/EmptyState';
import { Shield } from 'lucide-react';

export default async function AuditLogPage() {
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

  const { data: events } = await supabase
    .from('audit_events')
    .select('*')
    .eq('organization_id', membership.organization_id)
    .order('created_at', { ascending: false })
    .limit(100);

  const actorIds = [...new Set((events ?? []).map(e => e.actor_id).filter(Boolean))] as string[];
  let actorMap: Record<string, string> = {};
  if (actorIds.length > 0) {
    const { data: users } = await supabase
      .from('users')
      .select('id, full_name')
      .in('id', actorIds);
    actorMap = Object.fromEntries((users ?? []).map(u => [u.id, u.full_name]));
  }

  const enrichedEvents = (events ?? []).map(e => ({
    ...e,
    actor_name: e.actor_id ? actorMap[e.actor_id] : undefined,
  }));

  if (enrichedEvents.length === 0) {
    return (
      <EmptyState
        icon={Shield}
        title="No Activity Yet"
        description="Events will appear here as your team uses the platform."
      />
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-medium text-wg-text">Activity Log</h2>
        <span className="text-xs text-wg-muted">{enrichedEvents.length} events</span>
      </div>
      <div className="bg-wg-card rounded-xl border border-wg-border p-5">
        <ActivityTimeline events={enrichedEvents} />
      </div>
    </div>
  );
}
