-- =============================================================================
-- Sprint 2 — Repair Order Line Items, Canned Jobs, Signature Types
-- =============================================================================

begin;

-- ===========================================
-- Enums
-- ===========================================
create type line_item_type as enum (
  'labor',
  'parts',
  'sublet',
  'fee',
  'discount'
);

create type line_item_status as enum (
  'pending',
  'approved',
  'declined',
  'in_progress',
  'completed'
);

create type signature_type as enum (
  'intake_authorization',
  'estimate_approval',
  'work_authorization',
  'delivery_acceptance',
  'quality_signoff'
);

-- ===========================================
-- Canned Jobs (reusable service templates)
-- ===========================================
create table canned_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  category text,
  labor_hours decimal(6,2),
  labor_rate decimal(8,2),
  parts_cost decimal(10,2),
  total_estimate decimal(10,2),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_canned_jobs_org on canned_jobs(organization_id);

-- ===========================================
-- Repair Order Lines
-- ===========================================
create table repair_order_lines (
  id uuid primary key default uuid_generate_v4(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  canned_job_id uuid references canned_jobs(id) on delete set null,
  inspection_item_id uuid references inspection_items(id) on delete set null,
  line_type line_item_type not null default 'labor',
  description text not null,
  quantity decimal(8,2) not null default 1,
  unit_price decimal(10,2) not null default 0,
  discount_amount decimal(10,2) not null default 0,
  total decimal(10,2) not null default 0,
  status line_item_status not null default 'pending',
  technician_id uuid references users(id) on delete set null,
  sort_order integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_ro_lines_service_request on repair_order_lines(service_request_id);
create index idx_ro_lines_org on repair_order_lines(organization_id);
create index idx_ro_lines_inspection_item on repair_order_lines(inspection_item_id);

-- ===========================================
-- Add totals columns to service_requests
-- ===========================================
alter table service_requests
  add column subtotal decimal(10,2) not null default 0,
  add column tax_rate decimal(5,4) not null default 0,
  add column tax_amount decimal(10,2) not null default 0,
  add column total decimal(10,2) not null default 0,
  add column technician_id uuid references users(id) on delete set null;

create index idx_service_requests_technician on service_requests(technician_id);

-- ===========================================
-- Add signature_type to signatures table
-- ===========================================
alter table signatures
  add column type signature_type not null default 'work_authorization';

-- ===========================================
-- RPC: Recalculate service request totals
-- ===========================================
create or replace function recalculate_service_request_totals(sr_id uuid)
returns void as $$
declare
  v_subtotal decimal(10,2);
  v_tax_rate decimal(5,4);
  v_tax_amount decimal(10,2);
begin
  select coalesce(sum(total), 0) into v_subtotal
  from repair_order_lines
  where service_request_id = sr_id
    and status != 'declined';

  select tax_rate into v_tax_rate
  from service_requests
  where id = sr_id;

  v_tax_amount := round(v_subtotal * v_tax_rate, 2);

  update service_requests
  set subtotal = v_subtotal,
      tax_amount = v_tax_amount,
      total = v_subtotal + v_tax_amount,
      updated_at = now()
  where id = sr_id;
end;
$$ language plpgsql security definer;

-- ===========================================
-- Trigger: Auto-calculate line total on insert/update
-- ===========================================
create or replace function calculate_line_total()
returns trigger as $$
begin
  new.total := round((new.quantity * new.unit_price) - new.discount_amount, 2);
  return new;
end;
$$ language plpgsql;

create trigger trg_ro_line_total
  before insert or update on repair_order_lines
  for each row execute function calculate_line_total();

-- ===========================================
-- Trigger: Recalc SR totals when lines change
-- ===========================================
create or replace function trg_recalc_sr_totals()
returns trigger as $$
begin
  if tg_op = 'DELETE' then
    perform recalculate_service_request_totals(old.service_request_id);
    return old;
  else
    perform recalculate_service_request_totals(new.service_request_id);
    return new;
  end if;
end;
$$ language plpgsql;

create trigger trg_ro_lines_recalc
  after insert or update or delete on repair_order_lines
  for each row execute function trg_recalc_sr_totals();

-- ===========================================
-- Updated_at triggers for new tables
-- ===========================================
create trigger trg_canned_jobs_updated before update on canned_jobs for each row execute function update_updated_at();
create trigger trg_ro_lines_updated before update on repair_order_lines for each row execute function update_updated_at();

-- ===========================================
-- RLS Policies
-- ===========================================
alter table canned_jobs enable row level security;
alter table repair_order_lines enable row level security;

create policy "canned_jobs_org_read" on canned_jobs
  for select using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "canned_jobs_org_write" on canned_jobs
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

create policy "ro_lines_org_read" on repair_order_lines
  for select using (
    organization_id in (
      select organization_id from memberships where user_id = auth.uid()
    )
  );

create policy "ro_lines_org_write" on repair_order_lines
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

commit;
