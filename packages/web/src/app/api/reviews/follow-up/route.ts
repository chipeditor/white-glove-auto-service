import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { customerId, customerName, customerPhone, organizationId, serviceRequestId } = await request.json();

  if (!customerPhone || !organizationId) {
    return Response.json({ error: 'Missing required fields: customerPhone, organizationId' }, { status: 400 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings, twilio_phone_number')
    .eq('id', organizationId)
    .single();

  if (!org) {
    return Response.json({ error: 'Organization not found' }, { status: 404 });
  }

  const googlePlaceId = (org.settings as Record<string, unknown>)?.google_place_id as string | undefined;
  if (!googlePlaceId) {
    return Response.json({ error: 'Google Place ID not configured. Add it in Settings → Organization.' }, { status: 400 });
  }

  const reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`;
  const name = customerName ? customerName.split(' ')[0] : 'there';
  const shopName = org.name || 'our shop';

  const body = `Hi ${name}! Thank you for choosing ${shopName}. We'd love your feedback — please leave us a Google review: ${reviewUrl}`;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return Response.json({ error: 'Twilio not configured' }, { status: 500 });
  }

  const { data: allowed } = await supabase.rpc('check_and_increment_sms', { org_id: organizationId });
  if (!allowed) {
    return Response.json({ error: 'Daily SMS limit reached' }, { status: 429 });
  }

  const fromNumber = org.twilio_phone_number || process.env.TWILIO_PHONE_NUMBER;
  if (!fromNumber) {
    return Response.json({ error: 'No Twilio phone number configured' }, { status: 500 });
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const twilioBody = new URLSearchParams({
    To: customerPhone,
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
    return Response.json({ error: `Twilio request failed: ${err}` }, { status: 500 });
  }

  if (!twilioRes.ok) {
    await supabase.from('sms_messages').insert({
      organization_id: organizationId,
      customer_id: customerId || null,
      service_request_id: serviceRequestId || null,
      direction: 'outbound',
      from_number: fromNumber,
      to_number: customerPhone,
      body,
      status: 'failed',
      error_message: twilioData.message || 'Unknown error',
    });
    return Response.json({ error: twilioData.message || 'Failed to send review request' }, { status: 502 });
  }

  await supabase.from('sms_messages').insert({
    organization_id: organizationId,
    customer_id: customerId || null,
    service_request_id: serviceRequestId || null,
    direction: 'outbound',
    from_number: fromNumber,
    to_number: customerPhone,
    body,
    status: 'sent',
    twilio_sid: twilioData.sid,
    sent_at: new Date().toISOString(),
  });

  return Response.json({ success: true, reviewUrl, twilioSid: twilioData.sid });
}
