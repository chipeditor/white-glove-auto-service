import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';

const VALID_STATUSES = [
  'not_started',
  'in_progress',
  'completed',
  'needs_attention',
  'signed_off',
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const status = body.status as string;

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: `Invalid status: ${status}` }, { status: 400 });
  }

  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, organization_id, status')
    .eq('id', id)
    .single();

  if (!inspection) {
    return Response.json({ error: 'Inspection not found' }, { status: 404 });
  }

  const update: Record<string, unknown> = { status };
  if (status === 'in_progress' && inspection.status === 'not_started') {
    update.started_at = new Date().toISOString();
  }
  if (status === 'completed' || status === 'signed_off') {
    update.completed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('inspections').update(update).eq('id', id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await emitEvent({
    action: status === 'completed' ? 'inspection_completed' : 'status_changed',
    entityType: 'inspection',
    entityId: id,
    organizationId: inspection.organization_id,
    actorId: user.id,
    changes: { from: inspection.status, to: status },
  });

  return Response.json({ ok: true });
}
