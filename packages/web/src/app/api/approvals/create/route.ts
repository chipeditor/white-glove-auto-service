import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { serviceRequestId, organizationId, customerId } = await request.json();

  if (!serviceRequestId || !organizationId) {
    return Response.json({ error: 'Missing serviceRequestId or organizationId' }, { status: 400 });
  }

  // Generate a secure token (72-hour expiry)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { data: approval, error } = await supabase
    .from('approval_requests')
    .insert({
      organization_id: organizationId,
      service_request_id: serviceRequestId,
      customer_id: customerId || null,
      token,
      expires_at: expiresAt,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Update service request status to awaiting_customer_approval
  await supabase
    .from('service_requests')
    .update({ status: 'awaiting_customer_approval', updated_at: new Date().toISOString() })
    .eq('id', serviceRequestId);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://web-nine-livid-59.vercel.app';
  const approvalUrl = `${appUrl}/approve/${token}`;

  return Response.json({
    success: true,
    approvalId: approval.id,
    approvalUrl,
    token,
    expiresAt,
  });
}
