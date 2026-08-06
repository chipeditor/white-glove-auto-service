import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchHealthBoardData } from '@/lib/health-board';

const FALLBACK_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

async function resolveOrgId(): Promise<string> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return FALLBACK_ORG_ID;
    const { data: membership } = await supabase
      .from('memberships')
      .select('organization_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();
    return membership?.organization_id ?? FALLBACK_ORG_ID;
  } catch {
    return FALLBACK_ORG_ID;
  }
}

export async function GET() {
  try {
    const orgId = await resolveOrgId();
    const data = await fetchHealthBoardData(orgId);
    return Response.json(data);
  } catch (e) {
    console.error('Health board error:', e);
    return Response.json({ error: 'Failed to fetch health board' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await request.json();
  const { action } = body;

  if (action === 'flag_parts') {
    const { line_id, parts_status, parts_tier, parts_eta_days } = body;
    if (!line_id) return Response.json({ error: 'Missing line_id' }, { status: 400 });

    const update: Record<string, unknown> = {
      parts_status: parts_status || 'ordered',
      parts_tier: parts_tier || 'domestic',
      phase: 'hold',
    };
    if (parts_eta_days !== undefined) update.parts_eta_days = parts_eta_days;
    if (parts_status === 'ordered') update.parts_ordered_at = new Date().toISOString();
    if (parts_status === 'received') {
      update.parts_received_at = new Date().toISOString();
      update.phase = 'active';
    }

    const { error } = await supabase
      .from('repair_order_lines')
      .update(update)
      .eq('id', line_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === 'update_phase') {
    const { line_id, phase } = body;
    if (!line_id || !phase) return Response.json({ error: 'Missing line_id or phase' }, { status: 400 });

    const update: Record<string, unknown> = { phase };
    if (phase === 'active') update.work_started_at = new Date().toISOString();
    if (phase === 'complete') update.work_completed_at = new Date().toISOString();

    const { error } = await supabase
      .from('repair_order_lines')
      .update(update)
      .eq('id', line_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === 'set_promise') {
    const { service_request_id, promised_at } = body;
    if (!service_request_id || !promised_at) {
      return Response.json({ error: 'Missing service_request_id or promised_at' }, { status: 400 });
    }

    const { error } = await supabase
      .from('service_requests')
      .update({ promised_at })
      .eq('id', service_request_id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === 'tech_availability') {
    const { user_id, is_available_today, out_reason } = body;
    if (!user_id) return Response.json({ error: 'Missing user_id' }, { status: 400 });

    const { error } = await supabase
      .from('tech_capacity')
      .upsert({
        user_id,
        organization_id: FALLBACK_ORG_ID,
        is_available_today,
        out_reason: out_reason || null,
      }, { onConflict: 'user_id,organization_id' });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 });
}
