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

  // Try to create the user
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: staff.email,
    password: TEST_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: staff.name },
  });

  if (created?.user) {
    // New user created — set up profile and membership
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

    return Response.json({ email: staff.email, password: TEST_PASSWORD });
  }

  // User already exists — find their ID and reset password
  // Check our users table first
  const { data: dbUser } = await admin
    .from('users')
    .select('id')
    .eq('email', staff.email)
    .limit(1)
    .single();

  if (dbUser) {
    await admin.auth.admin.updateUserById(dbUser.id, { password: TEST_PASSWORD });
    return Response.json({ email: staff.email, password: TEST_PASSWORD });
  }

  // User exists in auth but not in our users table — scan auth users
  let page = 1;
  while (page <= 10) {
    const { data: batch } = await admin.auth.admin.listUsers({ page, perPage: 100 });
    const found = batch?.users?.find((u) => u.email === staff.email);
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password: TEST_PASSWORD });
      // Also create the users table entry
      await admin.from('users').upsert({
        id: found.id,
        email: staff.email,
        full_name: staff.name,
        default_role: staff.role,
      });
      const { data: orgs } = await admin.from('organizations').select('id').limit(1).single();
      if (orgs) {
        await admin.from('memberships').upsert({
          user_id: found.id,
          organization_id: orgs.id,
          role: staff.role,
          is_active: true,
        }, { onConflict: 'user_id,organization_id' });
      }
      return Response.json({ email: staff.email, password: TEST_PASSWORD });
    }
    if ((batch?.users?.length ?? 0) < 100) break;
    page++;
  }

  return Response.json({ error: createErr?.message ?? 'Could not set up user' }, { status: 500 });
}
