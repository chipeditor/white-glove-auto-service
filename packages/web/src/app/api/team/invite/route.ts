import { createServerSupabaseClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { emitEvent } from '@/lib/events';
import { sendEmail, teamInviteEmail } from '@/lib/email';

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: callerMembership } = await supabase
    .from('memberships')
    .select('role, organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single();

  if (!callerMembership || !['super_admin', 'shop_admin'].includes(callerMembership.role)) {
    return Response.json({ error: 'Only admins can invite members' }, { status: 403 });
  }

  const { email, fullName, organizationId, role } = await request.json();

  if (!email || !fullName || !organizationId || !role) {
    return Response.json({ error: 'Missing fields' }, { status: 400 });
  }

  if (organizationId !== callerMembership.organization_id) {
    return Response.json({ error: 'Organization mismatch' }, { status: 403 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email,
    password: 'changeme123',
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (authError) {
    return Response.json({ error: authError.message }, { status: 400 });
  }

  await admin.from('users').upsert({
    id: authUser.user.id,
    email,
    full_name: fullName,
    default_role: role,
  });

  await admin.from('memberships').insert({
    user_id: authUser.user.id,
    organization_id: organizationId,
    role,
    is_active: true,
  });

  await emitEvent({
    action: 'assigned',
    entityType: 'membership',
    entityId: authUser.user.id,
    organizationId,
    actorId: user.id,
    changes: { email, fullName, role },
  });

  // Email the invited team member
  const { data: inviterUser } = await supabase
    .from('users')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', organizationId)
    .single();
  const host = request.headers.get('host') ?? '';
  const proto = request.headers.get('x-forwarded-proto') ?? 'https';
  const loginUrl = `${proto}://${host}/login`;

  await sendEmail({
    to: email,
    subject: `You've been invited to ${org?.name || 'the team'}`,
    html: teamInviteEmail({
      inviteeName: fullName,
      inviterName: inviterUser?.full_name || 'An administrator',
      role: role.replace(/_/g, ' '),
      loginUrl,
      shopName: org?.name,
    }),
  });

  return Response.json({ success: true, userId: authUser.user.id });
}
