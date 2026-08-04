import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Webhook uses service role key — not user-scoped
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const messageSid = formData.get('MessageSid') as string;
  const messageStatus = formData.get('MessageStatus') as string;
  const from = formData.get('From') as string;
  const to = formData.get('To') as string;
  const body = formData.get('Body') as string;

  const supabase = getAdminClient();

  // Delivery status update for outbound messages
  if (messageSid && messageStatus && !body) {
    const statusMap: Record<string, string> = {
      queued: 'queued',
      sent: 'sent',
      delivered: 'delivered',
      undelivered: 'failed',
      failed: 'failed',
    };
    const dbStatus = statusMap[messageStatus] || 'sent';

    await supabase
      .from('sms_messages')
      .update({
        status: dbStatus,
        ...(dbStatus === 'delivered' ? { delivered_at: new Date().toISOString() } : {}),
        ...(dbStatus === 'failed' ? { error_message: `Twilio status: ${messageStatus}` } : {}),
      })
      .eq('twilio_sid', messageSid);

    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Inbound SMS — find org by the receiving number
  if (body && from) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('twilio_phone_number', to)
      .single();

    if (org) {
      // Find customer by phone number
      const normalizedFrom = from.replace(/\D/g, '').slice(-10);
      const { data: customers } = await supabase
        .from('customers')
        .select('id')
        .eq('organization_id', org.id)
        .ilike('phone', `%${normalizedFrom}`);

      await supabase.from('sms_messages').insert({
        organization_id: org.id,
        customer_id: customers?.[0]?.id || null,
        direction: 'inbound',
        from_number: from,
        to_number: to,
        body,
        status: 'received',
        twilio_sid: messageSid,
      });
    }

    // TwiML empty response — no auto-reply
    return new Response('<Response></Response>', {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  return new Response('<Response></Response>', {
    headers: { 'Content-Type': 'text/xml' },
  });
}
