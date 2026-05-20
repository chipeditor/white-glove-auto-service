-- White Glove Auto Service — Row Level Security Policies
-- All tables are org-scoped. Users can only access data within their organization.

alter table organizations enable row level security;
alter table users enable row level security;
alter table memberships enable row level security;
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table service_requests enable row level security;
alter table inspections enable row level security;
alter table inspection_sections enable row level security;
alter table inspection_items enable row level security;
alter table media_assets enable row level security;
alter table damage_markers enable row level security;
alter table checklists enable row level security;
alter table checklist_items enable row level security;
alter table signatures enable row level security;
alter table notifications enable row level security;
alter table affiliate_recommendations enable row level security;
alter table reports enable row level security;
alter table audit_events enable row level security;

-- Helper: get org IDs for current user
create or replace function get_user_org_ids()
returns setof uuid as $$
  select organization_id from memberships
  where user_id = auth.uid() and is_active = true;
$$ language sql security definer stable;

-- Helper: check if user has role in org
create or replace function has_org_role(org_id uuid, required_role user_role)
returns boolean as $$
  select exists(
    select 1 from memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and role = required_role
      and is_active = true
  );
$$ language sql security definer stable;

-- Helper: check if user is staff (non-customer) in org
create or replace function is_org_staff(org_id uuid)
returns boolean as $$
  select exists(
    select 1 from memberships
    where user_id = auth.uid()
      and organization_id = org_id
      and role in ('shop_admin', 'service_advisor', 'technician', 'delivery_specialist')
      and is_active = true
  );
$$ language sql security definer stable;

-- Organizations: members can read their orgs
create policy "org_select" on organizations for select using (
  id in (select get_user_org_ids())
);

create policy "org_update" on organizations for update using (
  has_org_role(id, 'shop_admin')
);

-- Users: can read own profile
create policy "users_select_self" on users for select using (
  id = auth.uid()
);

create policy "users_update_self" on users for update using (
  id = auth.uid()
);

-- Memberships: can see co-members in same org
create policy "memberships_select" on memberships for select using (
  organization_id in (select get_user_org_ids())
);

-- Customers: org staff can CRUD
create policy "customers_select" on customers for select using (
  organization_id in (select get_user_org_ids())
);

create policy "customers_insert" on customers for insert with check (
  is_org_staff(organization_id)
);

create policy "customers_update" on customers for update using (
  is_org_staff(organization_id)
);

-- Vehicles: org members can read, staff can write
create policy "vehicles_select" on vehicles for select using (
  organization_id in (select get_user_org_ids())
);

create policy "vehicles_insert" on vehicles for insert with check (
  is_org_staff(organization_id)
);

create policy "vehicles_update" on vehicles for update using (
  is_org_staff(organization_id)
);

-- Service Requests
create policy "sr_select" on service_requests for select using (
  organization_id in (select get_user_org_ids())
);

create policy "sr_insert" on service_requests for insert with check (
  is_org_staff(organization_id)
);

create policy "sr_update" on service_requests for update using (
  is_org_staff(organization_id)
);

-- Inspections
create policy "inspections_select" on inspections for select using (
  organization_id in (select get_user_org_ids())
);

create policy "inspections_insert" on inspections for insert with check (
  is_org_staff(organization_id)
);

create policy "inspections_update" on inspections for update using (
  is_org_staff(organization_id)
);

-- Inspection Sections (through inspection -> org)
create policy "sections_select" on inspection_sections for select using (
  inspection_id in (
    select id from inspections where organization_id in (select get_user_org_ids())
  )
);

create policy "sections_insert" on inspection_sections for insert with check (
  inspection_id in (
    select id from inspections where organization_id in (select get_user_org_ids())
  )
);

create policy "sections_update" on inspection_sections for update using (
  inspection_id in (
    select id from inspections where organization_id in (select get_user_org_ids())
  )
);

-- Inspection Items (through section -> inspection -> org)
create policy "items_select" on inspection_items for select using (
  section_id in (
    select s.id from inspection_sections s
    join inspections i on i.id = s.inspection_id
    where i.organization_id in (select get_user_org_ids())
  )
);

create policy "items_insert" on inspection_items for insert with check (
  section_id in (
    select s.id from inspection_sections s
    join inspections i on i.id = s.inspection_id
    where i.organization_id in (select get_user_org_ids())
  )
);

create policy "items_update" on inspection_items for update using (
  section_id in (
    select s.id from inspection_sections s
    join inspections i on i.id = s.inspection_id
    where i.organization_id in (select get_user_org_ids())
  )
);

-- Media Assets
create policy "media_select" on media_assets for select using (
  organization_id in (select get_user_org_ids())
);

create policy "media_insert" on media_assets for insert with check (
  is_org_staff(organization_id)
);

-- Damage Markers
create policy "damage_select" on damage_markers for select using (
  inspection_id in (
    select id from inspections where organization_id in (select get_user_org_ids())
  )
);

create policy "damage_insert" on damage_markers for insert with check (
  inspection_id in (
    select id from inspections where organization_id in (select get_user_org_ids())
  )
);

-- Checklists
create policy "checklists_select" on checklists for select using (
  organization_id in (select get_user_org_ids())
);

create policy "checklists_insert" on checklists for insert with check (
  is_org_staff(organization_id)
);

create policy "checklists_update" on checklists for update using (
  is_org_staff(organization_id)
);

-- Checklist Items
create policy "cl_items_select" on checklist_items for select using (
  checklist_id in (
    select id from checklists where organization_id in (select get_user_org_ids())
  )
);

create policy "cl_items_insert" on checklist_items for insert with check (
  checklist_id in (
    select id from checklists where organization_id in (select get_user_org_ids())
  )
);

create policy "cl_items_update" on checklist_items for update using (
  checklist_id in (
    select id from checklists where organization_id in (select get_user_org_ids())
  )
);

-- Signatures
create policy "signatures_select" on signatures for select using (
  organization_id in (select get_user_org_ids())
);

create policy "signatures_insert" on signatures for insert with check (
  organization_id in (select get_user_org_ids())
);

-- Notifications: user sees their own
create policy "notifications_select" on notifications for select using (
  user_id = auth.uid()
);

create policy "notifications_update" on notifications for update using (
  user_id = auth.uid()
);

create policy "notifications_insert" on notifications for insert with check (
  is_org_staff(organization_id)
);

-- Affiliate Recommendations
create policy "affiliate_select" on affiliate_recommendations for select using (
  organization_id in (select get_user_org_ids())
);

-- Reports
create policy "reports_select" on reports for select using (
  organization_id in (select get_user_org_ids())
);

create policy "reports_insert" on reports for insert with check (
  is_org_staff(organization_id)
);

-- Audit Events: staff can read
create policy "audit_select" on audit_events for select using (
  is_org_staff(organization_id)
);

create policy "audit_insert" on audit_events for insert with check (
  organization_id in (select get_user_org_ids())
);
