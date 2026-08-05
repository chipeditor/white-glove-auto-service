import { createServerSupabaseClient } from './supabase-server';
import type { AuditAction } from '@/shared/types';

interface EmitEventOptions {
  action: AuditAction;
  entityType: string;
  entityId: string;
  organizationId: string;
  actorId?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function emitEvent(opts: EmitEventOptions): Promise<void> {
  const supabase = await createServerSupabaseClient();

  let actorId = opts.actorId;
  if (!actorId) {
    const { data: { user } } = await supabase.auth.getUser();
    actorId = user?.id ?? undefined;
  }

  await supabase.from('audit_events').insert({
    organization_id: opts.organizationId,
    actor_id: actorId,
    action: opts.action,
    entity_type: opts.entityType,
    entity_id: opts.entityId,
    changes: opts.changes ?? null,
    metadata: opts.metadata ?? null,
  });
}
