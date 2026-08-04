-- =============================================================================
-- Sprint 3 — Customer Approvals, Declined Job Tracking, SMS/Twilio
-- =============================================================================

begin;

-- ===========================================
-- Enums
-- ===========================================
create type approval_status as enum (
  'pending',
  'viewed',
  'approved',
  'partially_approved',
  'declined'
);

create type sms_direction as enum ('outbound', 'inbound');
create type sms_status as enum ('queued', 'sent', 'delivered', 'failed', 'received');

-- ===========================================
-- Approval Requests
-- ===========================================
create table approval_requests (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  service_request_id uuid not null references service_requests(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  token text not null unique,
  status approval_status not null default 'pending',
  expires_at timestamptz not null,
  viewed_at timestamptz,
  responded_at timestamptz,
  customer_comments text,
  approved_line_ids uuid[] default '{}',
  declined_line_ids uuid[] default '{}',
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_approval_requests_token on approval_requests(token);
create index idx_approval_requests_sr on approval_requests(service_request_id);
create index idx_approval_requests_org on approval_requests(organization_id);

-- ===========================================
-- Declined Job Tracking
-- ===========================================
create table declined_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_request_id uuid not null references service_requests(id) on delete cascade,
  repair_order_line_id uuid not null references repair_order_lines(id) on delete cascade,
  description text not null,
  unit_price decimal(10,2) not null default 0,
  reason text,
  re_recommended boolean not null default false,
  re_recommended_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_declined_jobs_customer on declined_jobs(customer_id);
create index idx_declined_jobs_vehicle on declined_jobs(vehicle_id);

-- ===========================================
-- SMS Messages
-- ===========================================
create table sms_messages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  service_request_id uuid references service_requests(id) on delete set null,
  direction sms_direction not null,
  from_number text not null,
  to_number text not null,
  body text not null,
  status sms_status not null default 'queued',
  twilio_sid text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_sms_messages_org on sms_messages(organization_id);
create index idx_sms_messages_customer on sms_messages(customer_id);
create index idx_sms_messages_twilio_sid on sms_messages(twilio_sid);

-- ===========================================
-- SMS daily usage tracking (per-org limits)
-- ===========================================
create table sms_daily_usage (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  usage_date date not null default current_date,
  count integer not null default 0,
  unique(organization_id, usage_date)
);

-- ===========================================
-- Org settings: add Twilio config + SMS limit
-- ===========================================
alter table organizations
  add column if not exists twilio_phone_number text,
  add column if not exists daily_sms_limit integer not null default 200,
  add column if not exists tax_rate decimal(5,4) not null default 0.0825;

-- ===========================================
-- Updated_at triggers
-- ===========================================
create trigger trg_approval_requests_updated before update on approval_requests
  for each row execute function update_updated_at();

-- ===========================================
-- Auto-track declined jobs when approval responds
-- ===========================================
create or replace function track_declined_jobs()
returns trigger as $$
declare
  line record;
  v_vehicle_id uuid;
  v_customer_id uuid;
begin
  if new.status in ('declined', 'partially_approved') and array_length(new.declined_line_ids, 1) > 0 then
    select vehicle_id, customer_id into v_vehicle_id, v_customer_id
    from service_requests where id = new.service_request_id;

    for line in
      select id, description, unit_price
      from repair_order_lines
      where id = any(new.declined_line_ids)
    loop
      insert into declined_jobs (organization_id, customer_id, vehicle_id, service_request_id, repair_order_line_id, description, unit_price, reason)
      values (new.organization_id, coalesce(new.customer_id, v_customer_id), v_vehicle_id, new.service_request_id, line.id, line.description, line.unit_price, new.customer_comments)
      on conflict do nothing;
    end loop;

    update repair_order_lines set status = 'declined' where id = any(new.declined_line_ids);
    update repair_order_lines set status = 'approved' where id = any(new.approved_line_ids);
  end if;

  if new.status = 'approved' then
    update repair_order_lines set status = 'approved'
    where service_request_id = new.service_request_id and status = 'pending';

    update service_requests set status = 'approved', updated_at = now()
    where id = new.service_request_id and status = 'awaiting_customer_approval';
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger trg_approval_response
  after update on approval_requests
  for each row
  when (old.status = 'pending' or old.status = 'viewed')
  execute function track_declined_jobs();

-- ===========================================
-- RPC: increment SMS daily count, check limit
-- ===========================================
create or replace function check_and_increment_sms(org_id uuid)
returns boolean as $$
declare
  v_limit integer;
  v_count integer;
begin
  select daily_sms_limit into v_limit from organizations where id = org_id;

  insert into sms_daily_usage (organization_id, usage_date, count)
  values (org_id, current_date, 1)
  on conflict (organization_id, usage_date)
  do update set count = sms_daily_usage.count + 1
  returning count into v_count;

  return v_count <= v_limit;
end;
$$ language plpgsql security definer;

-- ===========================================
-- RLS Policies
-- ===========================================
alter table approval_requests enable row level security;
alter table declined_jobs enable row level security;
alter table sms_messages enable row level security;
alter table sms_daily_usage enable row level security;

-- Approval requests: org members can read/write, public can read by token
create policy "approval_requests_org_read" on approval_requests
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

create policy "approval_requests_org_write" on approval_requests
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

-- Public token-based read for customer approval page (anon key)
create policy "approval_requests_public_token" on approval_requests
  for select using (true);

create policy "approval_requests_public_update" on approval_requests
  for update using (true);

-- Declined jobs
create policy "declined_jobs_org_read" on declined_jobs
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

-- SMS messages
create policy "sms_messages_org_read" on sms_messages
  for select using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

create policy "sms_messages_org_write" on sms_messages
  for all using (
    organization_id in (
      select organization_id from memberships
      where user_id = auth.uid()
        and role in ('super_admin', 'shop_admin', 'service_advisor')
    )
  );

-- SMS daily usage
create policy "sms_daily_usage_org" on sms_daily_usage
  for all using (
    organization_id in (select organization_id from memberships where user_id = auth.uid())
  );

-- ===========================================
-- Enable Realtime on approval_requests
-- ===========================================
alter publication supabase_realtime add table approval_requests;

commit;
