import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';

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

  // Verify the service request belongs to the same org
  const { data: sr } = await supabase
    .from('service_requests')
    .select('id, organization_id, technician_id')
    .eq('id', id)
    .single();

  if (!sr) {
    return Response.json({ error: 'Service request not found' }, { status: 404 });
  }

  if (sr.organization_id !== membership.organization_id) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const technicianId: string | null = body.technician_id ?? null;

  const { data: updated, error } = await supabase
    .from('service_requests')
    .update({ technician_id: technicianId })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await emitEvent({
    action: 'technician_assigned',
    entityType: 'service_request',
    entityId: id,
    organizationId: membership.organization_id,
    actorId: user.id,
    changes: { technician_id: technicianId, previous_technician_id: sr.technician_id },
  });

  return Response.json(updated);
}
