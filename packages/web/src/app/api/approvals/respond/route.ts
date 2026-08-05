import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { emitEvent } from '@/lib/events';
import { sendEmail, approvalResponseEmail } from '@/lib/email';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const { token, approvedLineIds, declinedLineIds, comments } = await request.json();

  if (!token) {
    return Response.json({ error: 'Missing token' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Find approval request by token
  const { data: approval, error } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('token', token)
    .single();

  if (error || !approval) {
    return Response.json({ error: 'Invalid or expired approval link' }, { status: 404 });
  }

  if (new Date(approval.expires_at) < new Date()) {
    return Response.json({ error: 'This approval link has expired' }, { status: 410 });
  }

  if (approval.status !== 'pending' && approval.status !== 'viewed') {
    return Response.json({ error: 'This estimate has already been responded to' }, { status: 409 });
  }

  const approved: string[] = approvedLineIds || [];
  const declined: string[] = declinedLineIds || [];

  let status: string;
  if (declined.length === 0 && approved.length > 0) {
    status = 'approved';
  } else if (approved.length === 0 && declined.length > 0) {
    status = 'declined';
  } else {
    status = 'partially_approved';
  }

  // Update approval request — triggers track_declined_jobs()
  await supabase
    .from('approval_requests')
    .update({
      status,
      approved_line_ids: approved,
      declined_line_ids: declined,
      customer_comments: comments || null,
      responded_at: new Date().toISOString(),
    })
    .eq('id', approval.id);

  const eventAction = status === 'approved' ? 'customer_approved' : status === 'declined' ? 'customer_declined' : 'customer_approved';
  await emitEvent({
    action: eventAction,
    entityType: 'service_request',
    entityId: approval.service_request_id,
    organizationId: approval.organization_id,
    changes: { approved: approved.length, declined: declined.length, comments },
    metadata: { approvalId: approval.id, status },
  });

  // Email the advisor that the customer responded
  if (approval.created_by) {
    const { data: advisor } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', approval.created_by)
      .single();

    if (advisor?.email) {
      const { data: sr } = await supabase
        .from('service_requests')
        .select('title, vehicle_id, customer_id')
        .eq('id', approval.service_request_id)
        .single();
      const { data: customer } = sr?.customer_id
        ? await supabase.from('customers').select('full_name').eq('id', sr.customer_id).single()
        : { data: null };
      const { data: vehicle } = sr?.vehicle_id
        ? await supabase.from('vehicles').select('year, make, model').eq('id', sr.vehicle_id).single()
        : { data: null };
      const { data: org } = await supabase.from('organizations').select('name').eq('id', approval.organization_id).single();

      const vehicleName = vehicle ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim() : sr?.title || 'Vehicle';
      const isApproved = status === 'approved';

      await sendEmail({
        to: advisor.email,
        subject: `Customer ${isApproved ? 'Approved' : 'Declined'} — ${vehicleName}`,
        html: approvalResponseEmail({
          advisorName: advisor.full_name,
          customerName: customer?.full_name || 'Customer',
          vehicleName,
          approved: isApproved,
          shopName: org?.name,
        }),
      });
    }
  }

  return Response.json({ success: true, status });
}
