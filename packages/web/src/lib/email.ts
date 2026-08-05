const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_URL = 'https://api.resend.com/emails';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

interface SendEmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured — skipping email send');
    return { success: false, error: 'Email not configured' };
  }

  const from = opts.from || 'KSB Performance <notifications@resend.dev>';

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.html,
        reply_to: opts.replyTo,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', data);
      return { success: false, error: data.message || 'Failed to send email' };
    }

    return { success: true, id: data.id };
  } catch (err) {
    console.error('Email fetch error:', err);
    return { success: false, error: String(err) };
  }
}

const BRAND = {
  bg: '#0d0d14',
  card: '#1a1a2e',
  border: '#2a2a40',
  gold: '#c8a45c',
  text: '#e8e8f0',
  muted: '#9898b0',
  green: '#34d399',
  blue: '#4a90d9',
  red: '#e94560',
};

function emailLayout(content: string, shopName = 'KSB Performance'): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <tr><td style="padding:24px 0;text-align:center;">
    <span style="color:${BRAND.gold};font-size:20px;font-weight:700;letter-spacing:1px;">${shopName}</span>
  </td></tr>
  <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:32px;">
    ${content}
  </td></tr>
  <tr><td style="padding:24px 0;text-align:center;color:${BRAND.muted};font-size:12px;">
    &copy; ${new Date().getFullYear()} ${shopName}. All rights reserved.
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export function approvalRequestEmail(params: {
  customerName: string;
  vehicleName: string;
  totalAmount: string;
  approvalUrl: string;
  shopName?: string;
}): string {
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">Estimate Ready for Approval</h2>
    <p style="color:${BRAND.muted};margin:0 0 24px;font-size:14px;">Hi ${params.customerName},</p>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      Your estimate for the <strong>${params.vehicleName}</strong> is ready for review.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${BRAND.bg};border-radius:8px;padding:16px;">
      <tr><td style="color:${BRAND.muted};font-size:13px;">Estimated Total</td></tr>
      <tr><td style="color:${BRAND.gold};font-size:28px;font-weight:700;">${params.totalAmount}</td></tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0;">
      <a href="${params.approvalUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND.gold};color:${BRAND.bg};font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Review &amp; Approve
      </a>
    </td></tr></table>
    <p style="color:${BRAND.muted};font-size:12px;margin:20px 0 0;text-align:center;">
      Or copy this link: ${params.approvalUrl}
    </p>
  `, params.shopName);
}

export function approvalResponseEmail(params: {
  advisorName: string;
  customerName: string;
  vehicleName: string;
  approved: boolean;
  shopName?: string;
}): string {
  const status = params.approved ? 'Approved' : 'Declined';
  const color = params.approved ? BRAND.green : BRAND.red;
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">Customer ${status} Estimate</h2>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      <strong>${params.customerName}</strong> has <span style="color:${color};font-weight:600;">${status.toLowerCase()}</span>
      the estimate for <strong>${params.vehicleName}</strong>.
    </p>
    ${params.approved
      ? `<p style="color:${BRAND.muted};font-size:14px;">You can now proceed with the approved work.</p>`
      : `<p style="color:${BRAND.muted};font-size:14px;">Please follow up with the customer to discuss next steps.</p>`
    }
  `, params.shopName);
}

export function vehicleCheckedInEmail(params: {
  customerName: string;
  vehicleName: string;
  shopName?: string;
  shopPhone?: string;
}): string {
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">Vehicle Received</h2>
    <p style="color:${BRAND.muted};margin:0 0 24px;font-size:14px;">Hi ${params.customerName},</p>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      Your <strong>${params.vehicleName}</strong> has been checked in and our team is beginning the intake process.
      We'll keep you updated on the progress.
    </p>
    ${params.shopPhone ? `<p style="color:${BRAND.muted};font-size:13px;margin:20px 0 0;">Questions? Call us at ${params.shopPhone}</p>` : ''}
  `, params.shopName);
}

export function deliveryReadyEmail(params: {
  customerName: string;
  vehicleName: string;
  shopName?: string;
  shopPhone?: string;
  shopAddress?: string;
}): string {
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">Your Vehicle is Ready!</h2>
    <p style="color:${BRAND.muted};margin:0 0 24px;font-size:14px;">Hi ${params.customerName},</p>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      Great news — your <strong>${params.vehicleName}</strong> is ready for pickup.
    </p>
    ${params.shopAddress ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;background:${BRAND.bg};border-radius:8px;padding:16px;">
      <tr><td style="color:${BRAND.muted};font-size:13px;">Pickup Location</td></tr>
      <tr><td style="color:${BRAND.text};font-size:14px;padding-top:4px;">${params.shopAddress}</td></tr>
    </table>` : ''}
    ${params.shopPhone ? `<p style="color:${BRAND.muted};font-size:13px;">Call us at ${params.shopPhone} to arrange pickup.</p>` : ''}
  `, params.shopName);
}

export function vehicleDeliveredEmail(params: {
  customerName: string;
  vehicleName: string;
  reviewUrl?: string;
  shopName?: string;
}): string {
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">Thank You!</h2>
    <p style="color:${BRAND.muted};margin:0 0 24px;font-size:14px;">Hi ${params.customerName},</p>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      Thank you for trusting us with your <strong>${params.vehicleName}</strong>.
      We hope you're satisfied with the work.
    </p>
    ${params.reviewUrl ? `
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="${params.reviewUrl}" style="display:inline-block;padding:12px 28px;background:${BRAND.gold};color:${BRAND.bg};font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">
        Leave a Review ★
      </a>
    </td></tr></table>` : ''}
    <p style="color:${BRAND.muted};font-size:13px;text-align:center;">We look forward to serving you again.</p>
  `, params.shopName);
}

export function teamInviteEmail(params: {
  inviteeName: string;
  inviterName: string;
  role: string;
  loginUrl: string;
  shopName?: string;
}): string {
  return emailLayout(`
    <h2 style="color:${BRAND.text};margin:0 0 8px;font-size:22px;">You've Been Invited</h2>
    <p style="color:${BRAND.text};font-size:14px;line-height:1.6;">
      <strong>${params.inviterName}</strong> has invited you to join as
      <span style="color:${BRAND.gold};font-weight:600;">${params.role}</span>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 0;">
      <a href="${params.loginUrl}" style="display:inline-block;padding:14px 32px;background:${BRAND.gold};color:${BRAND.bg};font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;">
        Get Started
      </a>
    </td></tr></table>
  `, params.shopName);
}
