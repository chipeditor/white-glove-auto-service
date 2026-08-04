import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { to, body, customerId, serviceRequestId, organizationId } = await request.json();

  if (!to || !body || !organizationId) {
    return Response.json({ error: 'Missing required fields: to, body, organizationId' }, { status: 400 });
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return Response.json({ error: 'Twilio not configured' }, { status: 500 });
  }

  // Check daily SMS limit
  const { data: allowed } = await supabase.rpc('check_and_increment_sms', { org_id: organizationId });
  if (!allowed) {
    return Response.json({ error: 'Daily SMS limit reached' }, { status: 429 });
  }

  // Get org's Twilio phone number
  const { data: org } = await supabase
    .from('organizations')
    .select('twilio_phone_number')
    .eq('id', organizationId)
    .single();

  const fromNumber = org?.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    return Response.json({ error: 'No Twilio phone number configured' }, { status: 500 });
  }

  // Send via Twilio REST API
  console.log('SMS params:', { to, from: fromNumber, bodyLength: body?.length, orgPhone: org?.twilio_phone_number, envPhone: process.env.TWILIO_PHONE_NUMBER });
  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const twilioBody = new URLSearchParams({
    To: to,
    From: fromNumber,
    Body: body,
  });

  let twilioRes: Response;
  let twilioData: Record<string, unknown>;
  try {
    twilioRes = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: twilioBody.toString(),
    });
    twilioData = await twilioRes.json();
  } catch (err) {
    console.error('Twilio fetch error:', err);
    return Response.json({ error: `Twilio request failed: ${err}` }, { status: 500 });
  }

  if (!twilioRes.ok) {
    console.error('Twilio error:', JSON.stringify(twilioData));
    await supabase.from('sms_messages').insert({
      organization_id: organizationId,
      customer_id: customerId || null,
      service_request_id: serviceRequestId || null,
      direction: 'outbound',
      from_number: fromNumber,
      to_number: to,
      body,
      status: 'failed',
      error_message: twilioData.message || 'Unknown error',
    });

    return Response.json({ error: twilioData.message || 'Failed to send SMS' }, { status: 502 });
  }

  // Log successful send
  const { data: smsRecord } = await supabase.from('sms_messages').insert({
    organization_id: organizationId,
    customer_id: customerId || null,
    service_request_id: serviceRequestId || null,
    direction: 'outbound',
    from_number: fromNumber,
    to_number: to,
    body,
    status: 'sent',
    twilio_sid: twilioData.sid,
    sent_at: new Date().toISOString(),
  }).select().single();

  return Response.json({ success: true, messageId: smsRecord?.id, twilioSid: twilioData.sid });
}
