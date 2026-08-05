import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import {
  sendEmail,
  deliveryReadyEmail,
  vehicleDeliveredEmail,
} from '@/lib/email';

type EmailTemplate = 'delivery_ready' | 'vehicle_delivered' | 'custom';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { template, to, vehicleId, organizationId, subject, html } = body as {
    template: EmailTemplate;
    to: string;
    vehicleId?: string;
    organizationId: string;
    subject?: string;
    html?: string;
  };

  if (!to || !organizationId) {
    return Response.json({ error: 'Missing required fields: to, organizationId' }, { status: 400 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, phone, address_line1, city, state')
    .eq('id', organizationId)
    .single();

  const shopName = org?.name || 'KSB Performance';
  const shopPhone = org?.phone || undefined;
  const shopAddress = org?.address_line1
    ? `${org.address_line1}${org.city ? `, ${org.city}` : ''}${org.state ? `, ${org.state}` : ''}`
    : undefined;

  let emailSubject: string;
  let emailHtml: string;

  if (template === 'custom') {
    if (!subject || !html) {
      return Response.json({ error: 'Custom template requires subject and html' }, { status: 400 });
    }
    emailSubject = subject;
    emailHtml = html;
  } else {
    // Fetch vehicle and customer info for templated emails
    let vehicleName = 'Your vehicle';
    let customerName = 'Valued Customer';

    if (vehicleId) {
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('year, make, model, customer_id')
        .eq('id', vehicleId)
        .single();
      if (vehicle) {
        vehicleName = `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim();
        if (vehicle.customer_id) {
          const { data: customer } = await supabase
            .from('customers')
            .select('full_name')
            .eq('id', vehicle.customer_id)
            .single();
          if (customer) customerName = customer.full_name;
        }
      }
    }

    switch (template) {
      case 'delivery_ready':
        emailSubject = `Your ${vehicleName} is Ready for Pickup`;
        emailHtml = deliveryReadyEmail({
          customerName,
          vehicleName,
          shopName,
          shopPhone,
          shopAddress,
        });
        break;

      case 'vehicle_delivered': {
        let reviewUrl: string | undefined;
        const { data: settings } = await supabase
          .from('organizations')
          .select('settings')
          .eq('id', organizationId)
          .single();
        const googlePlaceId = (settings?.settings as Record<string, string> | null)?.google_place_id;
        if (googlePlaceId) {
          reviewUrl = `https://search.google.com/local/writereview?placeid=${googlePlaceId}`;
        }
        emailSubject = `Thank You — ${vehicleName}`;
        emailHtml = vehicleDeliveredEmail({
          customerName,
          vehicleName,
          reviewUrl,
          shopName,
        });
        break;
      }

      default:
        return Response.json({ error: `Unknown template: ${template}` }, { status: 400 });
    }
  }

  const result = await sendEmail({
    to,
    subject: emailSubject,
    html: emailHtml,
  });

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 502 });
  }

  return Response.json({ success: true, emailId: result.id });
}
