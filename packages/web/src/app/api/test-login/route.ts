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

  const { data: existingUsers } = await admin.auth.admin.listUsers();
  let userId = existingUsers?.users?.find((u) => u.email === staff.email)?.id;

  if (!userId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: staff.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: staff.name },
    });

    if (createErr) {
      return Response.json({ error: createErr.message }, { status: 500 });
    }
    userId = created.user.id;

    await admin.from('users').upsert({
      id: userId,
      email: staff.email,
      full_name: staff.name,
      default_role: staff.role,
    });

    const { data: orgs } = await admin.from('organizations').select('id').limit(1).single();
    if (orgs) {
      const { data: existing } = await admin
        .from('memberships')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', orgs.id)
        .limit(1)
        .single();

      if (!existing) {
        await admin.from('memberships').insert({
          user_id: userId,
          organization_id: orgs.id,
          role: staff.role,
          is_active: true,
        });
      }
    }
  } else {
    await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD });
  }

  return Response.json({ email: staff.email, password: TEST_PASSWORD });
}
