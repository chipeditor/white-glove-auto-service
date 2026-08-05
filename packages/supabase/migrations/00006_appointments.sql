-- Sprint 7: Online booking and appointment scheduling

begin;

create type appointment_status as enum (
  'scheduled',
  'confirmed',
  'checked_in',
  'in_progress',
  'completed',
  'cancelled',
  'no_show'
);

create table appointments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  service_request_id uuid references service_requests(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text,
  service_type text not null,
  description text,
  scheduled_date date not null,
  scheduled_time time not null,
  duration_minutes integer not null default 60,
  status appointment_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_appointments_org on appointments(organization_id);
create index idx_appointments_date on appointments(organization_id, scheduled_date);
create index idx_appointments_customer on appointments(customer_id);

create trigger trg_appointments_updated before update on appointments
  for each row execute function update_updated_at();

-- RLS
alter table appointments enable row level security;

create policy appointments_select on appointments for select using (
  organization_id in (
    select organization_id from memberships where user_id = auth.uid() and is_active = true
  )
);

create policy appointments_insert on appointments for insert with check (
  organization_id in (
    select organization_id from memberships where user_id = auth.uid() and is_active = true
  )
  or true  -- allow public booking (unauthenticated)
);

create policy appointments_update on appointments for update using (
  organization_id in (
    select organization_id from memberships where user_id = auth.uid() and is_active = true
  )
);

commit;
