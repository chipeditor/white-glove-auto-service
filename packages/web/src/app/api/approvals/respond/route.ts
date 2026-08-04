import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

  return Response.json({ success: true, status });
}
