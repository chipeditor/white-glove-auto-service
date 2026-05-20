-- White Glove Auto Service — Phase 1 Database Schema
-- PostgreSQL / Supabase

-- ===========================================
-- Extensions
-- ===========================================
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ===========================================
-- Enums
-- ===========================================
create type user_role as enum (
  'super_admin',
  'shop_admin',
  'service_advisor',
  'technician',
  'delivery_specialist',
  'customer'
);

create type vehicle_status as enum (
  'intake_started',
  'intake_completed',
  'in_service',
  'awaiting_approval',
  'ready_for_delivery',
  'delivered',
  'archived'
);

create type service_request_status as enum (
  'draft',
  'submitted',
  'awaiting_customer_approval',
  'approved',
  'declined',
  'in_progress',
  'quality_control',
  'ready_for_delivery',
  'completed'
);

create type inspection_status as enum (
  'not_started',
  'in_progress',
  'completed',
  'needs_attention',
  'signed_off'
);

create type inspection_type as enum (
  'intake',
  'mechanical',
  'cosmetic',
  'delivery',
  'quality_control',
  'spot_check'
);

create type media_type as enum (
  'photo',
  'video',
  'document'
);

create type notification_type as enum (
  'intake_started',
  'intake_completed',
  'approval_needed',
  'approval_received',
  'service_started',
  'service_completed',
  'delivery_ready',
  'vehicle_delivered',
  'issue_flagged',
  'report_ready'
);

create type damage_severity as enum (
  'minor',
  'moderate',
  'severe'
);

create type audit_action as enum (
  'created',
  'updated',
  'deleted',
  'status_changed',
  'assigned',
  'signed',
  'uploaded',
  'approved',
  'declined',
  'flagged'
);

-- ===========================================
-- Organizations
-- ===========================================
create table organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  phone text,
  email text,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  zip text,
  logo_url text,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_organizations_slug on organizations(slug);

-- ===========================================
-- Users (extends Supabase auth.users)
-- ===========================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  phone text,
  avatar_url text,
  default_role user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_email on users(email);

-- ===========================================
-- Memberships (user <-> organization)
-- ===========================================
create table memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role user_role not null default 'customer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

create index idx_memberships_org on memberships(organization_id);
create index idx_memberships_user on memberships(user_id);

-- ===========================================
-- Customers
-- ===========================================
create table customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  address_line1 text,
  city text,
  state text,
  zip text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_customers_org on customers(organization_id);
create index idx_customers_user on customers(user_id);

-- ===========================================
-- Vehicles
-- ===========================================
create table vehicles (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  vin text,
  year integer,
  make text not null,
  model text not null,
  trim text,
  color text,
  license_plate text,
  state text,
  mileage integer,
  engine text,
  transmission text,
  drivetrain text,
  photo_url text,
  status vehicle_status not null default 'intake_started',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_vehicles_org on vehicles(organization_id);
create index idx_vehicles_customer on vehicles(customer_id);
create index idx_vehicles_vin on vehicles(vin);
create index idx_vehicles_status on vehicles(organization_id, status);

-- ===========================================
-- Service Requests
-- ===========================================
create table service_requests (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  advisor_id uuid references users(id) on delete set null,
  title text not null,
  description text,
  status service_request_status not null default 'draft',
  priority integer not null default 0,
  estimated_completion timestamptz,
  actual_completion timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_service_requests_org on service_requests(organization_id);
create index idx_service_requests_vehicle on service_requests(vehicle_id);
create index idx_service_requests_status on service_requests(organization_id, status);

-- ===========================================
-- Inspections
-- ===========================================
create table inspections (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_request_id uuid references service_requests(id) on delete set null,
  inspector_id uuid references users(id) on delete set null,
  type inspection_type not null,
  status inspection_status not null default 'not_started',
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inspections_vehicle on inspections(vehicle_id);
create index idx_inspections_org_type on inspections(organization_id, type);

-- ===========================================
-- Inspection Sections
-- ===========================================
create table inspection_sections (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  status inspection_status not null default 'not_started',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inspection_sections_inspection on inspection_sections(inspection_id);

-- ===========================================
-- Inspection Items
-- ===========================================
create table inspection_items (
  id uuid primary key default uuid_generate_v4(),
  section_id uuid not null references inspection_sections(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  passed boolean,
  value text,
  notes text,
  flagged boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_inspection_items_section on inspection_items(section_id);

-- ===========================================
-- Media Assets
-- ===========================================
create table media_assets (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  inspection_id uuid references inspections(id) on delete set null,
  inspection_item_id uuid references inspection_items(id) on delete set null,
  uploaded_by uuid references users(id) on delete set null,
  type media_type not null default 'photo',
  storage_path text not null,
  url text not null,
  thumbnail_url text,
  file_name text,
  file_size integer,
  mime_type text,
  width integer,
  height integer,
  caption text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_media_org on media_assets(organization_id);
create index idx_media_vehicle on media_assets(vehicle_id);
create index idx_media_inspection on media_assets(inspection_id);

-- ===========================================
-- Damage Markers
-- ===========================================
create table damage_markers (
  id uuid primary key default uuid_generate_v4(),
  inspection_id uuid not null references inspections(id) on delete cascade,
  section_id uuid references inspection_sections(id) on delete set null,
  media_asset_id uuid references media_assets(id) on delete set null,
  x_position float,
  y_position float,
  label text,
  description text,
  severity damage_severity not null default 'minor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_damage_markers_inspection on damage_markers(inspection_id);

-- ===========================================
-- Checklists
-- ===========================================
create table checklists (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_request_id uuid references service_requests(id) on delete set null,
  assigned_to uuid references users(id) on delete set null,
  title text not null,
  description text,
  total_items integer not null default 0,
  completed_items integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_checklists_vehicle on checklists(vehicle_id);
create index idx_checklists_org on checklists(organization_id);

-- ===========================================
-- Checklist Items
-- ===========================================
create table checklist_items (
  id uuid primary key default uuid_generate_v4(),
  checklist_id uuid not null references checklists(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  completed_by uuid references users(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_checklist_items_checklist on checklist_items(checklist_id);

-- ===========================================
-- Signatures (placeholder)
-- ===========================================
create table signatures (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_request_id uuid references service_requests(id) on delete set null,
  signer_id uuid references users(id) on delete set null,
  signer_name text not null,
  signer_role text,
  signature_data text,
  signed_at timestamptz not null default now(),
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_signatures_vehicle on signatures(vehicle_id);

-- ===========================================
-- Notifications
-- ===========================================
create table notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  type notification_type not null,
  title text not null,
  body text not null,
  vehicle_id uuid references vehicles(id) on delete set null,
  service_request_id uuid references service_requests(id) on delete set null,
  read boolean not null default false,
  read_at timestamptz,
  action_url text,
  created_at timestamptz not null default now()
);

create index idx_notifications_user on notifications(user_id, read, created_at desc);
create index idx_notifications_org on notifications(organization_id);

-- ===========================================
-- Affiliate Recommendations
-- ===========================================
create table affiliate_recommendations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid references vehicles(id) on delete set null,
  inspection_item_id uuid references inspection_items(id) on delete set null,
  title text not null,
  description text,
  product_url text,
  image_url text,
  price decimal(10,2),
  affiliate_tag text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_affiliate_vehicle on affiliate_recommendations(vehicle_id);

-- ===========================================
-- Reports (placeholder)
-- ===========================================
create table reports (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vehicle_id uuid not null references vehicles(id) on delete cascade,
  service_request_id uuid references service_requests(id) on delete set null,
  title text not null,
  type text not null default 'inspection',
  status text not null default 'draft',
  pdf_url text,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_reports_vehicle on reports(vehicle_id);

-- ===========================================
-- Audit Events (append-only)
-- ===========================================
create table audit_events (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references users(id) on delete set null,
  action audit_action not null,
  entity_type text not null,
  entity_id uuid not null,
  changes jsonb,
  metadata jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index idx_audit_org on audit_events(organization_id, created_at desc);
create index idx_audit_entity on audit_events(entity_type, entity_id);

-- ===========================================
-- Updated_at trigger function
-- ===========================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger trg_organizations_updated before update on organizations for each row execute function update_updated_at();
create trigger trg_users_updated before update on users for each row execute function update_updated_at();
create trigger trg_memberships_updated before update on memberships for each row execute function update_updated_at();
create trigger trg_customers_updated before update on customers for each row execute function update_updated_at();
create trigger trg_vehicles_updated before update on vehicles for each row execute function update_updated_at();
create trigger trg_service_requests_updated before update on service_requests for each row execute function update_updated_at();
create trigger trg_inspections_updated before update on inspections for each row execute function update_updated_at();
create trigger trg_inspection_sections_updated before update on inspection_sections for each row execute function update_updated_at();
create trigger trg_inspection_items_updated before update on inspection_items for each row execute function update_updated_at();
create trigger trg_damage_markers_updated before update on damage_markers for each row execute function update_updated_at();
create trigger trg_checklists_updated before update on checklists for each row execute function update_updated_at();
create trigger trg_checklist_items_updated before update on checklist_items for each row execute function update_updated_at();
create trigger trg_reports_updated before update on reports for each row execute function update_updated_at();
