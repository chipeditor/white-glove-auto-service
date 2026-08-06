-- Staff could only ever read their own users row (`users_select_self`),
-- so every join to users from another table resolved to NULL:
--
--   * service_requests -> technician:users(*)  => technician always blank
--   * inspections      -> inspector:users(*)   => inspector always blank
--   * memberships      -> users(*)             => tech pickers came back empty
--
-- Assigning a technician appeared to do nothing, because the assignment
-- was written but the name could never be read back.
--
-- This grants read access to co-workers: users who share an active
-- organization membership with the caller. It does not widen writes —
-- `users_update_self` still limits updates to the caller's own row.

-- SECURITY DEFINER so the membership lookups inside bypass RLS. Without it,
-- a policy on `users` that reads `memberships` (whose own policy reads
-- `users`) risks recursive evaluation.
create or replace function is_org_coworker(target_user_id uuid)
returns boolean as $$
  select exists (
    select 1
    from memberships target
    where target.user_id = target_user_id
      and target.is_active = true
      and target.organization_id in (
        select organization_id
        from memberships self
        where self.user_id = auth.uid()
          and self.is_active = true
      )
  );
$$ language sql security definer stable;

-- Permissive policies are OR'd, so `users_select_self` still applies and a
-- user keeps access to their own row even with no active membership.
drop policy if exists "users_select_org_members" on users;

create policy "users_select_org_members" on users for select using (
  is_org_coworker(id)
);
