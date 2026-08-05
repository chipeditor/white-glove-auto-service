import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { emitEvent } from '@/lib/events';
import crypto from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const vehicleId = formData.get('vehicleId') as string | null;
  const organizationId = formData.get('organizationId') as string;
  const inspectionId = formData.get('inspectionId') as string | null;
  const inspectionItemId = formData.get('inspectionItemId') as string | null;
  const caption = formData.get('caption') as string | null;

  if (!file || !organizationId) {
    return Response.json({ error: 'Missing file or organizationId' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File exceeds 10 MB limit' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'pdf', 'mp4', 'mov'];
  if (!allowedTypes.includes(ext)) {
    return Response.json({ error: `File type .${ext} not allowed` }, { status: 400 });
  }

  const fileName = `${crypto.randomUUID()}.${ext}`;
  const storagePath = `${organizationId}/${vehicleId || 'general'}/${fileName}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = getAdminClient();

  const { error: uploadError } = await admin.storage
    .from('vehicle-media')
    .upload(storagePath, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from('vehicle-media')
    .getPublicUrl(storagePath);

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext);

  const { data: asset, error: insertError } = await admin
    .from('media_assets')
    .insert({
      organization_id: organizationId,
      vehicle_id: vehicleId || null,
      inspection_id: inspectionId || null,
      inspection_item_id: inspectionItemId || null,
      uploaded_by: user.id,
      type: isImage ? 'photo' : ext === 'pdf' ? 'document' : 'video',
      storage_path: storagePath,
      url: urlData.publicUrl,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      caption: caption || null,
    })
    .select()
    .single();

  if (insertError) {
    await admin.storage.from('vehicle-media').remove([storagePath]);
    return Response.json({ error: `Failed to save record: ${insertError.message}` }, { status: 500 });
  }

  await emitEvent({
    action: 'uploaded',
    entityType: 'vehicle',
    entityId: vehicleId || organizationId,
    organizationId,
    actorId: user.id,
    metadata: { fileName: file.name, fileSize: file.size, mediaAssetId: asset.id },
  });

  return Response.json({ success: true, asset });
}
