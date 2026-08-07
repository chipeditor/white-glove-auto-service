import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';

/// Replaces the marker set for an inspection.
///
/// The canvas hands back the whole set after every edit, so a diff-based API
/// would just be reconstructing what the client already knows. Replacement
/// keeps the two in sync and makes a dropped request self-healing.
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: inspection } = await supabase
    .from('inspections')
    .select('id, organization_id')
    .eq('id', id)
    .single();

  if (!inspection) {
    return Response.json({ error: 'Inspection not found' }, { status: 404 });
  }

  const body = await request.json();
  const markers = Array.isArray(body.markers) ? body.markers : [];

  const { error: deleteError } = await supabase
    .from('damage_markers')
    .delete()
    .eq('inspection_id', id);

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 });
  }

  if (markers.length > 0) {
    const rows = markers.map((m: Record<string, unknown>) => ({
      inspection_id: id,
      x_position: Number(m.x) || 0,
      y_position: Number(m.y) || 0,
      severity: ['minor', 'moderate', 'severe'].includes(m.severity as string)
        ? m.severity
        : 'minor',
      description: (m.note as string)?.trim() || null,
    }));

    const { error: insertError } = await supabase.from('damage_markers').insert(rows);
    if (insertError) {
      return Response.json({ error: insertError.message }, { status: 500 });
    }
  }

  await emitEvent({
    action: 'updated',
    entityType: 'inspection',
    entityId: id,
    organizationId: inspection.organization_id,
    actorId: user.id,
    metadata: { damage_marker_count: markers.length },
  });

  return Response.json({ ok: true, count: markers.length });
}
