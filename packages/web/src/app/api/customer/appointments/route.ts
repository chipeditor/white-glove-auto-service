/**
 * Pickup scheduling for the signed-in customer.
 *
 * Writes into the same `appointments` table and honours the same slot/conflict
 * contract as the public `/api/appointments` route (which the portal still uses
 * via GET to list free slots for a date). The difference is identity: org id and
 * customer details are resolved from the auth session rather than the request
 * body, so the appointment is really linked to the customer and their service
 * request instead of being an anonymous booking.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getCustomerContext, fetchActiveServiceRequest } from '@/lib/customer-queries';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const context = await getCustomerContext();
  if (!context) {
    return Response.json({ error: 'Not signed in as a customer' }, { status: 401 });
  }

  const { date, time, notes } = await request.json();
  if (!date || !time) {
    return Response.json({ error: 'Missing date or time' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { customer } = context;

  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', customer.organization_id)
    .eq('scheduled_date', date)
    .eq('scheduled_time', time)
    .not('status', 'in', '("cancelled","no_show")')
    .limit(1)
    .maybeSingle();

  if (existing) {
    return Response.json({ error: 'This time slot is no longer available' }, { status: 409 });
  }

  const serviceRequest = await fetchActiveServiceRequest(supabase, customer.id);

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: customer.organization_id,
      customer_id: customer.id,
      service_request_id: serviceRequest?.id ?? null,
      customer_name: customer.full_name,
      customer_email: customer.email,
      customer_phone: customer.phone,
      service_type: 'Vehicle Pickup',
      description: serviceRequest?.title ?? null,
      scheduled_date: date,
      scheduled_time: time,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
    })
    .select('id, scheduled_date, scheduled_time, status, service_type')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ appointment });
}
