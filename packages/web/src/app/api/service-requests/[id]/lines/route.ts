import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();

  const { data: line, error } = await supabase
    .from('repair_order_lines')
    .insert({
      service_request_id: id,
      organization_id: body.organization_id,
      line_type: body.line_type,
      description: body.description,
      quantity: body.quantity,
      unit_price: body.unit_price,
      discount_amount: body.discount_amount || 0,
      sort_order: body.sort_order || 0,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ line });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await params;
  const { searchParams } = new URL(request.url);
  const lineId = searchParams.get('lineId');

  if (!lineId) {
    return Response.json({ error: 'Missing lineId' }, { status: 400 });
  }

  const { error } = await supabase
    .from('repair_order_lines')
    .delete()
    .eq('id', lineId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
