import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';
import { sendEmail, approvalRequestEmail } from '@/lib/email';
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

  const host = request.headers.get('host') ?? '';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const appUrl = `${proto}://${host}`;
  const approvalUrl = `${appUrl}/approve/${token}`;

  await emitEvent({
    action: 'approval_sent',
    entityType: 'service_request',
    entityId: serviceRequestId,
    organizationId,
    actorId: user.id,
    metadata: { approvalId: approval.id, expiresAt },
  });

  // Send approval email to customer
  if (customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('full_name, email')
      .eq('id', customerId)
      .single();

    if (customer?.email) {
      const { data: sr } = await supabase
        .from('service_requests')
        .select('title, vehicle_id')
        .eq('id', serviceRequestId)
        .single();
      const { data: vehicle } = sr?.vehicle_id
        ? await supabase.from('vehicles').select('year, make, model').eq('id', sr.vehicle_id).single()
        : { data: null };
      const { data: lines } = await supabase
        .from('service_request_lines')
        .select('total')
        .eq('service_request_id', serviceRequestId);
      const total = (lines || []).reduce((s: number, l: { total: number }) => s + (l.total || 0), 0);
      const { data: org } = await supabase.from('organizations').select('name').eq('id', organizationId).single();

      const vehicleName = vehicle ? `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim() : sr?.title || 'Vehicle';

      await sendEmail({
        to: customer.email,
        subject: `Estimate Ready — ${vehicleName}`,
        html: approvalRequestEmail({
          customerName: customer.full_name,
          vehicleName,
          totalAmount: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          approvalUrl,
          shopName: org?.name,
        }),
      });
    }
  }

  return Response.json({
    success: true,
    approvalId: approval.id,
    approvalUrl,
    token,
    expiresAt,
  });
}
