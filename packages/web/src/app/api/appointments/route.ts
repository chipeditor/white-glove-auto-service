import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get('orgId');
  const date = searchParams.get('date');

  if (!orgId || !date) {
    return Response.json({ error: 'Missing orgId or date' }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: appointments } = await supabase
    .from('appointments')
    .select('scheduled_time, duration_minutes')
    .eq('organization_id', orgId)
    .eq('scheduled_date', date)
    .not('status', 'in', '("cancelled","no_show")');

  const bookedTimes = (appointments ?? []).map(a => a.scheduled_time);

  const slots: string[] = [];
  for (let h = 8; h < 17; h++) {
    for (const m of ['00', '30']) {
      const time = `${h.toString().padStart(2, '0')}:${m}:00`;
      if (!bookedTimes.includes(time)) {
        slots.push(time);
      }
    }
  }

  return Response.json({ slots });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { orgId, customerName, customerEmail, customerPhone, serviceType, description, date, time } = body;

  if (!orgId || !customerName || !serviceType || !date || !time) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getAdminClient();

  const { data: existing } = await supabase
    .from('appointments')
    .select('id')
    .eq('organization_id', orgId)
    .eq('scheduled_date', date)
    .eq('scheduled_time', time)
    .not('status', 'in', '("cancelled","no_show")')
    .limit(1)
    .single();

  if (existing) {
    return Response.json({ error: 'This time slot is no longer available' }, { status: 409 });
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: orgId,
      customer_name: customerName.trim(),
      customer_email: customerEmail?.trim() || null,
      customer_phone: customerPhone?.trim() || null,
      service_type: serviceType,
      description: description?.trim() || null,
      scheduled_date: date,
      scheduled_time: time,
      duration_minutes: 60,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ appointment });
}
