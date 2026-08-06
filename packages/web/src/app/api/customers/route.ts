import { createServerSupabaseClient } from '@/lib/supabase-server';
import { fetchCustomers } from '@/lib/queries';
import { emitEvent } from '@/lib/events';

export async function GET() {
  const customers = await fetchCustomers();
  return Response.json(customers);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) {
    return Response.json({ error: 'No organization' }, { status: 403 });
  }

  const body = await request.json();
  const fullName = body.full_name?.trim();
  if (!fullName) {
    return Response.json({ error: 'Name is required' }, { status: 400 });
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      organization_id: membership.organization_id,
      full_name: fullName,
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address_line1: body.address_line1?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      zip: body.zip?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select('*')
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  await emitEvent({
    action: 'created',
    entityType: 'customer',
    entityId: customer.id,
    organizationId: membership.organization_id,
    actorId: user.id,
  });

  return Response.json(customer);
}
