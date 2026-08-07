import { createServerSupabaseClient } from '@/lib/supabase-server';

/// Updates a single inspection item — pass/fail, flag, notes, or measured value.
export async function PATCH(
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
  const update: Record<string, unknown> = {};

  // `passed` is deliberately tri-state: true / false / null (not yet checked).
  if ('passed' in body) update.passed = body.passed;
  if ('flagged' in body) update.flagged = Boolean(body.flagged);
  if ('notes' in body) update.notes = body.notes?.trim() || null;
  if ('value' in body) update.value = body.value?.trim() || null;

  if (Object.keys(update).length === 0) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('inspection_items')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}
