-- =============================================================================
-- Sprint 12 — Health Board: Parts Tracking, Phase Gates, Sublets, Comebacks
-- =============================================================================

begin;

-- ===========================================
-- New Enums
-- ===========================================

create type parts_status as enum (
  'not_needed',
  'ordered',
  'backordered',
  'received'
);

create type parts_tier as enum (
  'local',
  'domestic',
  'factory',
  'fabrication'
);

create type work_phase as enum (
  'diagnosis',
  'scoped',
  'active',
  'hold',
  'qc',
  'complete'
);

create type sublet_status as enum (
  'pending',
  'sent',
  'in_progress',
  'returned',
  'cancelled'
);

-- ===========================================
-- Extend repair_order_lines
-- ===========================================

alter table repair_order_lines
  add column parts_status parts_status not null default 'not_needed',
  add column parts_tier parts_tier,
  add column parts_eta_days integer,
  add column parts_ordered_at timestamptz,
  add column parts_received_at timestamptz,
  add column work_started_at timestamptz,
  add column work_completed_at timestamptz,
  add column phase work_phase not null default 'scoped';

create index idx_ro_lines_parts_status on repair_order_lines(parts_status)
  where parts_status != 'not_needed';
create index idx_ro_lines_phase on repair_order_lines(phase);

-- ===========================================
-- Extend service_requests
-- ===========================================

alter table service_requests
  add column promised_at timestamptz,
  add column diagnosis_completed_at timestamptz,
  add column is_discovery boolean not null default false,
  add column parent_request_id uuid references service_requests(id) on delete set null;

create index idx_sr_promised on service_requests(promised_at)
  where promised_at is not null;
create index idx_sr_parent on service_requests(parent_request_id)
  where parent_request_id is not null;

-- ===========================================
-- Extend organizations
-- ===========================================

alter table organizations
  add column default_buffer_hours decimal(5,2) not null default 4,
  add column bay_count integer not null default 4;

-- ===========================================
-- Sublet Jobs
-- ===========================================

create table sublet_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_request_id uuid not null references service_requests(id) on delete cascade,
  line_id uuid references repair_order_lines(id) on delete set null,
  vendor_name text not null,
  vendor_type text,
  description text,
  sent_at timestamptz,
  promised_return timestamptz,
  actual_return timestamptz,
  cost decimal(10,2),
  status sublet_status not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_sublet_jobs_sr on sublet_jobs(service_request_id);
create index idx_sublet_jobs_org on sublet_jobs(organization_id);
create index idx_sublet_jobs_status on sublet_jobs(status) where status != 'returned';

-- ===========================================
-- Tech Capacity
-- ===========================================

create table tech_capacity (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  daily_hours decimal(4,2) not null default 8,
  is_available_today boolean not null default true,
  out_reason text,
  updated_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

create index idx_tech_capacity_org on tech_capacity(organization_id);

-- ===========================================
-- Comebacks (rework tracking)
-- ===========================================

create table comebacks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  original_request_id uuid not null references service_requests(id) on delete cascade,
  return_request_id uuid references service_requests(id) on delete set null,
  technician_id uuid references users(id) on delete set null,
  same_system boolean not null default true,
  days_since_delivery integer,
  description text,
  root_cause text,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_comebacks_org on comebacks(organization_id);
create index idx_comebacks_tech on comebacks(technician_id);
create index idx_comebacks_original on comebacks(original_request_id);

-- ===========================================
-- Updated_at triggers
-- ===========================================

create trigger trg_sublet_jobs_updated before update on sublet_jobs
  for each row execute function update_updated_at();

create trigger trg_tech_capacity_updated before update on tech_capacity
  for each row execute function update_updated_at();

-- ===========================================
-- New audit event types
-- ===========================================

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'discovery_found';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'scope_expanded';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'parts_ordered';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'parts_backordered';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'phase_changed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'sublet_sent';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'sublet_returned';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'comeback_logged';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'tech_unavailable';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'promise_date_set';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'promise_date_changed';

-- ===========================================
-- RLS Policies
-- ===========================================

alter table sublet_jobs enable row level security;
alter table tech_capacity enable row level security;
alter table comebacks enable row level security;

create policy "sublet_jobs_org_read" on sublet_jobs
  for select using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "sublet_jobs_org_write" on sublet_jobs
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

create policy "tech_capacity_org_read" on tech_capacity
  for select using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "tech_capacity_org_write" on tech_capacity
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  )
  with check (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

create policy "tech_capacity_self_write" on tech_capacity
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "comebacks_org_read" on comebacks
  for select using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "comebacks_org_write" on comebacks
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

-- ===========================================
-- View: Health board summary per service request
-- Calculates delivery estimates based on labor + parts + buffer
-- ===========================================

create or replace view health_board_sr as
select
  sr.id,
  sr.organization_id,
  sr.vehicle_id,
  sr.technician_id,
  sr.advisor_id,
  sr.title,
  sr.status,
  sr.priority,
  sr.promised_at,
  sr.estimated_completion,
  sr.diagnosis_completed_at,
  sr.is_discovery,
  sr.parent_request_id,
  sr.created_at,
  sr.updated_at,
  -- Labor summary
  coalesce(sum(case when rol.line_type = 'labor' and rol.status != 'declined' then rol.quantity else 0 end), 0) as total_labor_hours,
  coalesce(sum(case when rol.line_type = 'labor' and rol.phase = 'complete' then rol.quantity else 0 end), 0) as completed_labor_hours,
  coalesce(sum(case when rol.line_type = 'labor' and rol.phase = 'active' then rol.quantity else 0 end), 0) as active_labor_hours,
  -- Parts summary
  count(case when rol.parts_status = 'ordered' then 1 end) as parts_ordered_count,
  count(case when rol.parts_status = 'backordered' then 1 end) as parts_backordered_count,
  max(case when rol.parts_status in ('ordered', 'backordered') then rol.parts_eta_days end) as max_parts_eta_days,
  -- Phase summary
  count(case when rol.phase = 'diagnosis' then 1 end) as lines_in_diagnosis,
  count(case when rol.phase = 'active' then 1 end) as lines_active,
  count(case when rol.phase = 'hold' then 1 end) as lines_on_hold,
  count(case when rol.phase = 'complete' then 1 end) as lines_complete,
  count(case when rol.status != 'declined' then 1 end) as total_lines,
  -- Sublet summary
  count(distinct sub.id) filter (where sub.status in ('pending', 'sent', 'in_progress')) as active_sublets
from service_requests sr
left join repair_order_lines rol on rol.service_request_id = sr.id
left join sublet_jobs sub on sub.service_request_id = sr.id
where sr.status not in ('completed', 'declined', 'draft')
group by sr.id;

commit;
