import { createServerSupabaseClient } from '@/lib/supabase-server';

/// Marks a single notification read, or every unread one when `all` is set.
export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const now = new Date().toISOString();

  // Scope every write to the caller so one user cannot clear another's inbox.
  let query = supabase
    .from('notifications')
    .update({ read: true, read_at: now })
    .eq('user_id', user.id)
    .eq('read', false);

  if (!body.all) {
    if (!body.id) {
      return Response.json({ error: 'Missing id' }, { status: 400 });
    }
    query = query.eq('id', body.id);
  }

  const { error } = await query;
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
