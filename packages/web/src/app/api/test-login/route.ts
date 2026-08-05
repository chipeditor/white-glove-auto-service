import { createClient } from '@supabase/supabase-js';

const TEST_PASSWORD = 'testpass123!';

const STAFF = [
  { name: 'Aiden', email: 'aiden@ksbperformance.com', role: 'service_advisor' },
  { name: 'Juan', email: 'juan@ksbperformance.com', role: 'shop_admin' },
  { name: 'Geo', email: 'geo@ksbperformance.com', role: 'technician' },
  { name: 'James', email: 'james@ksbperformance.com', role: 'technician' },
];

export async function POST(request: Request) {
  const { email } = await request.json();
  const staff = STAFF.find((s) => s.email === email);
  if (!staff) {
    return Response.json({ error: 'Unknown staff member' }, { status: 400 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: staff.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: staff.name },
  });

  if (created?.user) {
    await admin.from('users').upsert({
      id: created.user.id,
      email: staff.email,
      full_name: staff.name,
      default_role: staff.role,
    });

    const { data: orgs } = await admin.from('organizations').select('id').limit(1).single();
    if (orgs) {
      await admin.from('memberships').upsert({
        user_id: created.user.id,
        organization_id: orgs.id,
        role: staff.role,
        is_active: true,
      }, { onConflict: 'user_id,organization_id' });
    }
  } else if (createErr) {
    // User already exists — find them and reset password
    const { data: users } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const existing = users?.users?.find((u) => u.email === staff.email);
    if (existing) {
      await admin.auth.admin.updateUserById(existing.id, { password: TEST_PASSWORD });
    } else {
      return Response.json({ error: createErr.message }, { status: 500 });
    }
  }

  return Response.json({ email: staff.email, password: TEST_PASSWORD });
}
