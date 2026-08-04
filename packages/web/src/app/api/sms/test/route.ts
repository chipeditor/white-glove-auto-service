export async function GET() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return Response.json({ error: 'Missing Twilio env vars', has: { accountSid: !!accountSid, authToken: !!authToken, fromNumber: !!fromNumber } });
  }

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const body = new URLSearchParams({
    To: '+18478816560',
    From: '+15722318038',
    Body: 'Test from White Glove Auto Service',
  });

  try {
    const res = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });
    const data = await res.json();
    return Response.json({ status: res.status, data });
  } catch (err) {
    return Response.json({ error: String(err) });
  }
}
