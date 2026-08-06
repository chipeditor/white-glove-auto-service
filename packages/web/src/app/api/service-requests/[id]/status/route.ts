import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';
import type { ServiceRequestStatus } from '@/shared/types';

const VALID_STATUSES: ServiceRequestStatus[] = [
  'draft',
  'submitted',
  'awaiting_customer_approval',
  'approved',
  'declined',
  'in_progress',
  'quality_control',
  'ready_for_delivery',
  'completed',
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) {
    return Response.json({ error: 'No organization' }, { status: 403 });
  }

  const { id } = await params;

  const { data: sr } = await supabase
    .from('service_requests')
    .select('id, organization_id, status')
    .eq('id', id)
    .single();

  if (!sr) {
    return Response.json({ error: 'Service request not found' }, { status: 404 });
  }

  if (sr.organization_id !== membership.organization_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const status: ServiceRequestStatus = body.status;

  if (!VALID_STATUSES.includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from('service_requests')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await emitEvent({
    action: 'status_changed',
    entityType: 'service_request',
    entityId: id,
    organizationId: membership.organization_id,
    actorId: user.id,
    changes: { status, previous_status: sr.status },
  });

  return Response.json(updated);
}
