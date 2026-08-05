import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const vehicleId = searchParams.get('vehicleId');
  const inspectionId = searchParams.get('inspectionId');
  const inspectionItemId = searchParams.get('inspectionItemId');

  let query = supabase
    .from('media_assets')
    .select('*')
    .order('created_at', { ascending: false });

  if (vehicleId) query = query.eq('vehicle_id', vehicleId);
  if (inspectionId) query = query.eq('inspection_id', inspectionId);
  if (inspectionItemId) query = query.eq('inspection_item_id', inspectionItemId);

  const { data, error } = await query.limit(100);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data);
}

export async function DELETE(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  const { data: asset } = await supabase
    .from('media_assets')
    .select('storage_path')
    .eq('id', id)
    .single();

  if (!asset) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const admin = getAdminClient();
  await admin.storage.from('vehicle-media').remove([asset.storage_path]);
  await admin.from('media_assets').delete().eq('id', id);

  return Response.json({ success: true });
}
