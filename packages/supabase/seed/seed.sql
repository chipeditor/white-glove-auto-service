-- =============================================================================
-- White Glove Auto Service — Seed Data
-- =============================================================================
-- Run after migrations. Creates realistic demo data for development and demos.
--
-- UUID pattern:
--   org:                  a0000000-0000-0000-0000-00000000000X
--   users:                b0000000-0000-0000-0000-00000000000X
--   memberships:          b1000000-0000-0000-0000-00000000000X
--   customers:            c0000000-0000-0000-0000-00000000000X
--   vehicles:             d0000000-0000-0000-0000-00000000000X
--   service_requests:     e0000000-0000-0000-0000-00000000000X
--   inspections:          f0000000-0000-0000-0000-00000000000X
--   inspection_sections:  f1000000-0000-0000-0000-0000000000XX
--   inspection_items:     f2000000-0000-0000-0000-0000000000XX
--   checklists:           f3000000-0000-0000-0000-00000000000X
--   checklist_items:      f4000000-0000-0000-0000-0000000000XX
--   notifications:        f5000000-0000-0000-0000-00000000000X
--   affiliate_recs:       f6000000-0000-0000-0000-00000000000X
--   media_assets:         f7000000-0000-0000-0000-00000000000X
--   audit_events:         f8000000-0000-0000-0000-00000000000X
-- =============================================================================

begin;

-- ===========================================
-- 1. Organization
-- ===========================================
insert into organizations (id, name, slug, phone, email, address_line1, city, state, zip, settings) values
  ('a0000000-0000-0000-0000-000000000001',
   'White Glove Demo Garage',
   'white-glove-demo',
   '(310) 555-0100',
   'service@whitegloveauto.demo',
   '1234 Concours Boulevard',
   'Los Angeles',
   'CA',
   '90210',
   '{"timezone": "America/Los_Angeles", "currency": "USD", "business_hours": {"mon_fri": "8:00-18:00", "sat": "9:00-14:00"}}'::jsonb
  );


-- ===========================================
-- 2. Users
-- ===========================================
-- NOTE: In production, these users must first exist in Supabase auth.users.
-- For local seed/demo purposes we insert directly into auth.users with a
-- placeholder encrypted_password. If your Supabase instance enforces the FK
-- strictly, run the auth inserts below first. Otherwise, temporarily disable
-- the FK or use supabase auth admin API to create them.

-- Create auth.users entries for seed data (demo/dev only)
insert into auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, aud, role)
values
  ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'john.smith@whitegloveauto.demo',    crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'sarah.williams@whitegloveauto.demo', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'david.chen@whitegloveauto.demo',     crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'alex.rodriguez@whitegloveauto.demo', crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'emily.davis@whitegloveauto.demo',    crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'mike.johnson@example.com',           crypt('demo-password-123', gen_salt('bf')), now(), now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- Public users table
insert into users (id, email, full_name, phone, default_role) values
  ('b0000000-0000-0000-0000-000000000001', 'john.smith@whitegloveauto.demo',    'John Smith',      '(310) 555-0101', 'shop_admin'),
  ('b0000000-0000-0000-0000-000000000002', 'sarah.williams@whitegloveauto.demo', 'Sarah Williams',  '(310) 555-0102', 'service_advisor'),
  ('b0000000-0000-0000-0000-000000000003', 'david.chen@whitegloveauto.demo',     'David Chen',      '(310) 555-0103', 'technician'),
  ('b0000000-0000-0000-0000-000000000004', 'alex.rodriguez@whitegloveauto.demo', 'Alex Rodriguez',  '(310) 555-0104', 'technician'),
  ('b0000000-0000-0000-0000-000000000005', 'emily.davis@whitegloveauto.demo',    'Emily Davis',     '(310) 555-0105', 'delivery_specialist'),
  ('b0000000-0000-0000-0000-000000000006', 'mike.johnson@example.com',           'Mike Johnson',    '(310) 555-0200', 'customer');


-- ===========================================
-- 3. Memberships
-- ===========================================
insert into memberships (id, user_id, organization_id, role) values
  ('b1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'shop_admin'),
  ('b1000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'service_advisor'),
  ('b1000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'technician'),
  ('b1000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'technician'),
  ('b1000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'delivery_specialist'),
  ('b1000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'customer');


-- ===========================================
-- 4. Customers
-- ===========================================
insert into customers (id, organization_id, user_id, full_name, email, phone, address_line1, city, state, zip, notes) values
  ('c0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'Mike Johnson',
   'mike.johnson@example.com',
   '(310) 555-0200',
   '789 Sunset Drive',
   'Beverly Hills',
   'CA',
   '90210',
   'VIP client. Prefers text updates. Collector — owns multiple performance vehicles.'
  ),
  ('c0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'Sarah Williams',
   'sarah.williams@whitegloveauto.demo',
   '(310) 555-0102',
   '456 Pacific Avenue',
   'Santa Monica',
   'CA',
   '90401',
   'Staff member who also has a personal vehicle in service.'
  );


-- ===========================================
-- 5. Vehicles
-- ===========================================
insert into vehicles (id, organization_id, customer_id, vin, year, make, model, trim, color, license_plate, state, mileage, engine, transmission, drivetrain, status, notes) values
  -- Corvette (Mike Johnson) — in_service
  ('d0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   '1G1YB2D73F5100001', 2015, 'Chevrolet', 'Corvette', 'Z51 3LT',
   'Torch Red', 'ABC1234', 'CA', 5312,
   '6.2L LT1 V8', '7-Speed Manual', 'RWD',
   'in_service',
   'Customer requests full performance inspection and delivery prep. Check brake pads — customer mentioned slight squeal under heavy braking.'
  ),
  -- Porsche 911 (Sarah Williams) — ready_for_delivery
  ('d0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000002',
   'WP0A82A99MS123456', 2021, 'Porsche', '911 Carrera S', null,
   'GT Silver', '8POR911', 'CA', 12450,
   '3.0L Twin-Turbo Flat-6', '8-Speed PDK', 'RWD',
   'ready_for_delivery',
   'Annual service completed. New brake fluid and cabin filter installed.'
  ),
  -- BMW M4 — awaiting_approval
  ('d0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'WBS4Y9C08L5P12345', 2020, 'BMW', 'M4 Competition', null,
   'Isle of Man Green', '4BMW2020', 'CA', 28900,
   '3.0L S58 Twin-Turbo I6', '6-Speed Manual', 'RWD',
   'awaiting_approval',
   'Inspection flagged front tire wear at 3/32". Recommend replacement before next track day.'
  ),
  -- Mercedes G63 — intake_completed
  ('d0000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'WDB4632761X345678', 2019, 'Mercedes-Benz', 'G63 AMG', null,
   'Obsidian Black', 'G63BOSS', 'CA', 34200,
   '4.0L V8 Biturbo', '9-Speed Automatic', 'AWD',
   'intake_completed',
   'Brought in for annual detail and ceramic coating refresh.'
  ),
  -- Audi RS5 — in_service
  ('d0000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'WUAPWAF55JA123456', 2018, 'Audi', 'RS5', null,
   'Nardo Gray', 'RS5NRDO', 'CA', 41000,
   '2.9L V6 Twin-Turbo', '8-Speed Tiptronic', 'AWD',
   'in_service',
   'Oil change, brake inspection, and software update. Customer requests loaner vehicle if service exceeds one day.'
  );


-- ===========================================
-- 6. Service Requests
-- ===========================================
insert into service_requests (id, organization_id, vehicle_id, customer_id, advisor_id, title, description, status, priority, estimated_completion) values
  ('e0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'Performance inspection and delivery verification',
   'Full multi-point performance inspection including brake, suspension, and drivetrain checks. Prepare vehicle for customer delivery with full detail and quality control sign-off.',
   'in_progress',
   1,
   now() + interval '3 days'
  ),
  ('e0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000002',
   'c0000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000002',
   'Annual service — Porsche 911',
   'Routine annual service. Brake fluid flush, cabin filter, and multi-point inspection.',
   'ready_for_delivery',
   0,
   now() - interval '1 day'
  ),
  ('e0000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000003',
   'c0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'Tire replacement approval — BMW M4',
   'Front tires measured at 3/32" tread depth. Awaiting customer approval for Michelin Pilot Sport 4S replacement.',
   'awaiting_customer_approval',
   2,
   now() + interval '5 days'
  );


-- ===========================================
-- 7. Inspections
-- ===========================================

-- Intake inspection for Corvette (completed)
insert into inspections (id, organization_id, vehicle_id, service_request_id, inspector_id, type, status, started_at, completed_at, notes) values
  ('f0000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'intake',
   'completed',
   now() - interval '2 days',
   now() - interval '2 days' + interval '45 minutes',
   'Vehicle arrived in excellent condition. Minor stone chip noted on front bumper. All panels aligned. Interior pristine.'
  );

-- Mechanical inspection for Corvette (in_progress)
insert into inspections (id, organization_id, vehicle_id, service_request_id, inspector_id, type, status, started_at, notes) values
  ('f0000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'mechanical',
   'in_progress',
   now() - interval '1 day',
   'Brake pad measurement in progress. Suspension components look good so far.'
  );


-- ===========================================
-- 8. Inspection Sections (intake inspection)
-- ===========================================
insert into inspection_sections (id, inspection_id, name, sort_order, status, notes) values
  ('f1000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'Exterior Front',    1,  'completed', null),
  ('f1000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'Exterior Rear',     2,  'completed', null),
  ('f1000000-0000-0000-0000-000000000003', 'f0000000-0000-0000-0000-000000000001', 'Driver Side',       3,  'completed', null),
  ('f1000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000001', 'Passenger Side',    4,  'completed', null),
  ('f1000000-0000-0000-0000-000000000005', 'f0000000-0000-0000-0000-000000000001', 'Wheels & Tires',    5,  'completed', null),
  ('f1000000-0000-0000-0000-000000000006', 'f0000000-0000-0000-0000-000000000001', 'Glass & Lights',    6,  'completed', null),
  ('f1000000-0000-0000-0000-000000000007', 'f0000000-0000-0000-0000-000000000001', 'Interior',          7,  'completed', null),
  ('f1000000-0000-0000-0000-000000000008', 'f0000000-0000-0000-0000-000000000001', 'Engine Bay',        8,  'completed', null),
  ('f1000000-0000-0000-0000-000000000009', 'f0000000-0000-0000-0000-000000000001', 'Warning Lights',    9,  'completed', null),
  ('f1000000-0000-0000-0000-000000000010', 'f0000000-0000-0000-0000-000000000001', 'Final Notes',       10, 'completed', 'Vehicle in excellent overall condition for a 2015 model.');


-- ===========================================
-- 9. Inspection Items
-- ===========================================

-- Exterior Front
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000001', 'f1000000-0000-0000-0000-000000000001', 'Hood condition',               1, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000002', 'f1000000-0000-0000-0000-000000000001', 'Front bumper',                 2, true,  'Fair',  'Small stone chip on lower valance — approx 3mm. Not through to metal.', true),
  ('f2000000-0000-0000-0000-000000000003', 'f1000000-0000-0000-0000-000000000001', 'Grille & badge',               3, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000004', 'f1000000-0000-0000-0000-000000000001', 'Headlights',                   4, true,  'Good',  'Both HID headlights functioning. No condensation.', false);

-- Exterior Rear
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000005', 'f1000000-0000-0000-0000-000000000002', 'Rear bumper',                  1, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000006', 'f1000000-0000-0000-0000-000000000002', 'Taillights',                   2, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000007', 'f1000000-0000-0000-0000-000000000002', 'Exhaust tips',                 3, true,  'Good',  'Quad tips in good condition. No discoloration.', false),
  ('f2000000-0000-0000-0000-000000000008', 'f1000000-0000-0000-0000-000000000002', 'Trunk / hatch operation',      4, true,  'Good',  null, false);

-- Driver Side
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000009', 'f1000000-0000-0000-0000-000000000003', 'Door panel & paint',           1, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000010', 'f1000000-0000-0000-0000-000000000003', 'Mirror condition',             2, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000011', 'f1000000-0000-0000-0000-000000000003', 'Door handle & latch',          3, true,  'Good',  null, false);

-- Passenger Side
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000012', 'f1000000-0000-0000-0000-000000000004', 'Door panel & paint',           1, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000013', 'f1000000-0000-0000-0000-000000000004', 'Mirror condition',             2, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000014', 'f1000000-0000-0000-0000-000000000004', 'Door handle & latch',          3, true,  'Good',  null, false);

-- Wheels & Tires
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000015', 'f1000000-0000-0000-0000-000000000005', 'Front left tire tread',        1, true,  '6/32"', 'Michelin Pilot Sport 4S — good tread remaining.', false),
  ('f2000000-0000-0000-0000-000000000016', 'f1000000-0000-0000-0000-000000000005', 'Front right tire tread',       2, true,  '6/32"', null, false),
  ('f2000000-0000-0000-0000-000000000017', 'f1000000-0000-0000-0000-000000000005', 'Rear left tire tread',         3, true,  '5/32"', null, false),
  ('f2000000-0000-0000-0000-000000000018', 'f1000000-0000-0000-0000-000000000005', 'Rear right tire tread',        4, true,  '5/32"', null, false),
  ('f2000000-0000-0000-0000-000000000019', 'f1000000-0000-0000-0000-000000000005', 'Wheel condition (all four)',   5, true,  'Good',  'No curb rash or damage on any of the four wheels.', false);

-- Glass & Lights
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000020', 'f1000000-0000-0000-0000-000000000006', 'Windshield',                  1, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000021', 'f1000000-0000-0000-0000-000000000006', 'Side windows',                2, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000022', 'f1000000-0000-0000-0000-000000000006', 'Rear glass / window',         3, true,  'Good',  null, false),
  ('f2000000-0000-0000-0000-000000000023', 'f1000000-0000-0000-0000-000000000006', 'Turn signals & markers',      4, true,  'Good',  'All signals functioning correctly.', false);

-- Interior
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000024', 'f1000000-0000-0000-0000-000000000007', 'Seats & upholstery',          1, true,  'Excellent', 'Leather seats in excellent condition. No wear or cracks.', false),
  ('f2000000-0000-0000-0000-000000000025', 'f1000000-0000-0000-0000-000000000007', 'Dashboard & trim',            2, true,  'Good',      null, false),
  ('f2000000-0000-0000-0000-000000000026', 'f1000000-0000-0000-0000-000000000007', 'Steering wheel',              3, true,  'Good',      'Flat-bottom wheel in good condition. No peeling.', false),
  ('f2000000-0000-0000-0000-000000000027', 'f1000000-0000-0000-0000-000000000007', 'Infotainment system',         4, true,  'Good',      'MyLink system boots normally. Backup camera functioning.', false),
  ('f2000000-0000-0000-0000-000000000028', 'f1000000-0000-0000-0000-000000000007', 'Carpet & floor mats',         5, true,  'Good',      null, false);

-- Engine Bay
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000029', 'f1000000-0000-0000-0000-000000000008', 'Engine oil level',            1, true,  'Full',      null, false),
  ('f2000000-0000-0000-0000-000000000030', 'f1000000-0000-0000-0000-000000000008', 'Coolant level',               2, true,  'Full',      null, false),
  ('f2000000-0000-0000-0000-000000000031', 'f1000000-0000-0000-0000-000000000008', 'Brake fluid level',           3, true,  'Good',      null, false),
  ('f2000000-0000-0000-0000-000000000032', 'f1000000-0000-0000-0000-000000000008', 'Belt condition',              4, true,  'Good',      'Serpentine belt shows no cracking or glazing.', false),
  ('f2000000-0000-0000-0000-000000000033', 'f1000000-0000-0000-0000-000000000008', 'Visible leaks',               5, true,  'None',      'No visible fluid leaks.', false);

-- Warning Lights
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000034', 'f1000000-0000-0000-0000-000000000009', 'Check engine light',          1, true,  'Off',  null, false),
  ('f2000000-0000-0000-0000-000000000035', 'f1000000-0000-0000-0000-000000000009', 'ABS warning',                 2, true,  'Off',  null, false),
  ('f2000000-0000-0000-0000-000000000036', 'f1000000-0000-0000-0000-000000000009', 'TPMS',                        3, true,  'Off',  'All tires at 34 PSI.', false),
  ('f2000000-0000-0000-0000-000000000037', 'f1000000-0000-0000-0000-000000000009', 'Airbag warning',              4, true,  'Off',  null, false);

-- Final Notes
insert into inspection_items (id, section_id, label, sort_order, passed, value, notes, flagged) values
  ('f2000000-0000-0000-0000-000000000038', 'f1000000-0000-0000-0000-000000000010', 'Overall condition rating',    1, true,  '9/10',  'Outstanding condition for a 2015 model year. Single minor stone chip is only notable defect.', false),
  ('f2000000-0000-0000-0000-000000000039', 'f1000000-0000-0000-0000-000000000010', 'Fuel level at intake',        2, null,  '3/4',   null, false),
  ('f2000000-0000-0000-0000-000000000040', 'f1000000-0000-0000-0000-000000000010', 'Odometer reading',            3, null,  '5,312', 'Confirmed matches customer-reported mileage.', false);


-- ===========================================
-- 10. Media Assets (sample references)
-- ===========================================
insert into media_assets (id, organization_id, vehicle_id, inspection_id, inspection_item_id, uploaded_by, type, storage_path, url, file_name, caption) values
  ('f7000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   'f2000000-0000-0000-0000-000000000002',
   'b0000000-0000-0000-0000-000000000003',
   'photo',
   'vehicles/d0000001/intake/front-bumper-chip.jpg',
   'https://placeholder.demo/vehicles/d0000001/intake/front-bumper-chip.jpg',
   'front-bumper-chip.jpg',
   'Stone chip on lower front valance — approximately 3mm diameter'
  ),
  ('f7000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   null,
   'b0000000-0000-0000-0000-000000000003',
   'photo',
   'vehicles/d0000001/intake/exterior-front-overview.jpg',
   'https://placeholder.demo/vehicles/d0000001/intake/exterior-front-overview.jpg',
   'exterior-front-overview.jpg',
   'Corvette Z51 front three-quarter — intake documentation'
  ),
  ('f7000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'f0000000-0000-0000-0000-000000000001',
   null,
   'b0000000-0000-0000-0000-000000000003',
   'photo',
   'vehicles/d0000001/intake/engine-bay.jpg',
   'https://placeholder.demo/vehicles/d0000001/intake/engine-bay.jpg',
   'engine-bay.jpg',
   'LT1 engine bay — clean, no visible leaks'
  );


-- ===========================================
-- 11. Service Checklist (Corvette) — 12 items, 7 completed
-- ===========================================
insert into checklists (id, organization_id, vehicle_id, service_request_id, assigned_to, title, description, total_items, completed_items) values
  ('f3000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'Performance Service Checklist',
   'Full multi-point performance inspection and service items for 2015 Corvette Z51.',
   12, 7
  );

insert into checklist_items (id, checklist_id, label, sort_order, completed, completed_at, completed_by, notes) values
  ('f4000000-0000-0000-0000-000000000001', 'f3000000-0000-0000-0000-000000000001', 'Engine oil & filter change (Mobil 1 0W-40)',       1,  true,  now() - interval '1 day',                     'b0000000-0000-0000-0000-000000000003', 'Used 8 quarts Mobil 1 0W-40 and AC Delco PF64 filter.'),
  ('f4000000-0000-0000-0000-000000000002', 'f3000000-0000-0000-0000-000000000001', 'Brake fluid flush (DOT 4)',                        2,  true,  now() - interval '1 day' + interval '30 min',  'b0000000-0000-0000-0000-000000000003', null),
  ('f4000000-0000-0000-0000-000000000003', 'f3000000-0000-0000-0000-000000000001', 'Coolant level and condition check',                3,  true,  now() - interval '1 day' + interval '45 min',  'b0000000-0000-0000-0000-000000000003', 'Coolant is clean, level full. No flush needed.'),
  ('f4000000-0000-0000-0000-000000000004', 'f3000000-0000-0000-0000-000000000001', 'Spark plug inspection',                            4,  true,  now() - interval '23 hours',                   'b0000000-0000-0000-0000-000000000003', 'All 8 plugs inspected. Good condition — no replacement needed at this mileage.'),
  ('f4000000-0000-0000-0000-000000000005', 'f3000000-0000-0000-0000-000000000001', 'Serpentine belt inspection',                       5,  true,  now() - interval '22 hours',                   'b0000000-0000-0000-0000-000000000003', 'Belt in good shape. No cracking or glazing.'),
  ('f4000000-0000-0000-0000-000000000006', 'f3000000-0000-0000-0000-000000000001', 'Brake pad measurement (all four corners)',         6,  true,  now() - interval '20 hours',                   'b0000000-0000-0000-0000-000000000003', 'FL: 7mm, FR: 7mm, RL: 8mm, RR: 8mm. All within spec.'),
  ('f4000000-0000-0000-0000-000000000007', 'f3000000-0000-0000-0000-000000000001', 'Tire pressure and tread depth',                    7,  true,  now() - interval '19 hours',                   'b0000000-0000-0000-0000-000000000003', 'Set all to 34 PSI cold. Tread depths recorded in intake inspection.'),
  ('f4000000-0000-0000-0000-000000000008', 'f3000000-0000-0000-0000-000000000001', 'Suspension component inspection',                  8,  false, null, null, null),
  ('f4000000-0000-0000-0000-000000000009', 'f3000000-0000-0000-0000-000000000001', 'Differential fluid check',                         9,  false, null, null, null),
  ('f4000000-0000-0000-0000-000000000010', 'f3000000-0000-0000-0000-000000000001', 'Transmission fluid check',                         10, false, null, null, null),
  ('f4000000-0000-0000-0000-000000000011', 'f3000000-0000-0000-0000-000000000001', 'OBD-II scan and code check',                       11, false, null, null, null),
  ('f4000000-0000-0000-0000-000000000012', 'f3000000-0000-0000-0000-000000000001', 'Test drive and performance verification',           12, false, null, null, null);


-- ===========================================
-- 12. Delivery Checklist (Corvette) — 12 items, 0 completed
-- ===========================================
insert into checklists (id, organization_id, vehicle_id, service_request_id, assigned_to, title, description, total_items, completed_items) values
  ('f3000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000005',
   'Delivery Preparation Checklist',
   'Final delivery preparation and quality control before customer handoff.',
   12, 0
  );

insert into checklist_items (id, checklist_id, label, sort_order, completed) values
  ('f4000000-0000-0000-0000-000000000013', 'f3000000-0000-0000-0000-000000000002', 'Full exterior wash and dry',                        1,  false),
  ('f4000000-0000-0000-0000-000000000014', 'f3000000-0000-0000-0000-000000000002', 'Clay bar treatment',                                2,  false),
  ('f4000000-0000-0000-0000-000000000015', 'f3000000-0000-0000-0000-000000000002', 'Paint sealant application',                          3,  false),
  ('f4000000-0000-0000-0000-000000000016', 'f3000000-0000-0000-0000-000000000002', 'Interior vacuum and wipe-down',                      4,  false),
  ('f4000000-0000-0000-0000-000000000017', 'f3000000-0000-0000-0000-000000000002', 'Leather conditioning',                               5,  false),
  ('f4000000-0000-0000-0000-000000000018', 'f3000000-0000-0000-0000-000000000002', 'Glass cleaning (interior and exterior)',              6,  false),
  ('f4000000-0000-0000-0000-000000000019', 'f3000000-0000-0000-0000-000000000002', 'Tire dressing',                                      7,  false),
  ('f4000000-0000-0000-0000-000000000020', 'f3000000-0000-0000-0000-000000000002', 'Verify all service items completed',                  8,  false),
  ('f4000000-0000-0000-0000-000000000021', 'f3000000-0000-0000-0000-000000000002', 'Quality control walk-around',                         9,  false),
  ('f4000000-0000-0000-0000-000000000022', 'f3000000-0000-0000-0000-000000000002', 'Photograph vehicle for delivery report',              10, false),
  ('f4000000-0000-0000-0000-000000000023', 'f3000000-0000-0000-0000-000000000002', 'Prepare service summary for customer',                11, false),
  ('f4000000-0000-0000-0000-000000000024', 'f3000000-0000-0000-0000-000000000002', 'Stage vehicle in delivery bay',                       12, false);


-- ===========================================
-- 13. Notifications (concierge-style messages for Mike Johnson)
-- ===========================================
insert into notifications (id, organization_id, user_id, type, title, body, vehicle_id, service_request_id, read, read_at, action_url, created_at) values
  ('f5000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'intake_completed',
   'Intake Complete — 2015 Corvette Z51',
   'Good news, Mike. Your Corvette has been received and the intake inspection is complete. Everything looks excellent — we noted one minor stone chip on the front valance, which we will keep an eye on. Your full inspection report is ready for review whenever you have a moment.',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   true,
   now() - interval '2 days' + interval '1 hour',
   '/vehicles/d0000000-0000-0000-0000-000000000001/inspections',
   now() - interval '2 days' + interval '1 hour'
  ),
  ('f5000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'service_started',
   'Service Underway — Corvette Z51',
   'David has started the performance inspection on your Corvette. We are working through the multi-point checklist and will keep you updated as we go. Estimated completion is within the next two to three days.',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   true,
   now() - interval '1 day' + interval '2 hours',
   '/vehicles/d0000000-0000-0000-0000-000000000001/service',
   now() - interval '1 day' + interval '2 hours'
  ),
  ('f5000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'approval_needed',
   'Your Approval Needed — BMW M4 Tires',
   'Mike, during our inspection of your BMW M4 Competition, we found that both front tires are at 3/32" tread depth and should be replaced before your next track outing. We recommend the Michelin Pilot Sport 4S — the same tire currently on the vehicle. Please review and approve at your convenience.',
   'd0000000-0000-0000-0000-000000000003',
   'e0000000-0000-0000-0000-000000000003',
   false,
   null,
   '/vehicles/d0000000-0000-0000-0000-000000000003/approvals',
   now() - interval '4 hours'
  ),
  ('f5000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'issue_flagged',
   'Item Flagged — Corvette Front Bumper',
   'A minor stone chip was documented on the lower front valance of your Corvette during intake. The chip is approximately 3mm and has not reached the metal. No immediate action is required, but we wanted to make sure you were aware. We can arrange a touch-up if you would like — just let us know.',
   'd0000000-0000-0000-0000-000000000001',
   'e0000000-0000-0000-0000-000000000001',
   true,
   now() - interval '1 day' + interval '3 hours',
   '/vehicles/d0000000-0000-0000-0000-000000000001/inspections',
   now() - interval '2 days'
  ),
  ('f5000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000006',
   'delivery_ready',
   'Ready for Pickup — Porsche 911 Carrera S',
   'Great news, Mike. Sarah''s Porsche 911 Carrera S has completed its annual service and is ready for pickup at your convenience. The vehicle has been detailed and is staged in our delivery bay. Feel free to schedule a time that works for you, or stop by anytime during business hours.',
   'd0000000-0000-0000-0000-000000000002',
   'e0000000-0000-0000-0000-000000000002',
   false,
   null,
   '/vehicles/d0000000-0000-0000-0000-000000000002/delivery',
   now() - interval '2 hours'
  );


-- ===========================================
-- 14. Affiliate Recommendation
-- ===========================================
insert into affiliate_recommendations (id, organization_id, vehicle_id, inspection_item_id, title, description, product_url, image_url, price, affiliate_tag, category) values
  ('f6000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'd0000000-0000-0000-0000-000000000003',
   null,
   'Michelin Pilot Sport 4S — 265/35ZR19',
   'Ultra-high-performance summer tire. Recommended replacement for front tires on the 2020 BMW M4 Competition. Excellent grip and tread life for street and occasional track use.',
   'https://www.tirerack.com/tires/michelin-pilot-sport-4s-265-35zr19',
   'https://placeholder.demo/products/michelin-ps4s-265-35-19.jpg',
   232.99,
   'wgauto-demo-001',
   'Tires'
  );


-- ===========================================
-- 15. Audit Events
-- ===========================================
insert into audit_events (id, organization_id, actor_id, action, entity_type, entity_id, changes, metadata, created_at) values
  ('f8000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'created',
   'service_request',
   'e0000000-0000-0000-0000-000000000001',
   '{"title": "Performance inspection and delivery verification"}'::jsonb,
   '{"source": "web_app"}'::jsonb,
   now() - interval '2 days' - interval '1 hour'
  ),
  ('f8000000-0000-0000-0000-000000000002',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'status_changed',
   'inspection',
   'f0000000-0000-0000-0000-000000000001',
   '{"status": {"from": "not_started", "to": "in_progress"}}'::jsonb,
   '{"source": "mobile_app"}'::jsonb,
   now() - interval '2 days'
  ),
  ('f8000000-0000-0000-0000-000000000003',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'status_changed',
   'inspection',
   'f0000000-0000-0000-0000-000000000001',
   '{"status": {"from": "in_progress", "to": "completed"}}'::jsonb,
   '{"source": "mobile_app"}'::jsonb,
   now() - interval '2 days' + interval '45 minutes'
  ),
  ('f8000000-0000-0000-0000-000000000004',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'uploaded',
   'media_asset',
   'f7000000-0000-0000-0000-000000000001',
   null,
   '{"file_name": "front-bumper-chip.jpg", "source": "mobile_app"}'::jsonb,
   now() - interval '2 days' + interval '10 minutes'
  ),
  ('f8000000-0000-0000-0000-000000000005',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'flagged',
   'inspection_item',
   'f2000000-0000-0000-0000-000000000002',
   '{"label": "Front bumper", "notes": "Small stone chip on lower valance"}'::jsonb,
   '{"source": "mobile_app"}'::jsonb,
   now() - interval '2 days' + interval '12 minutes'
  ),
  ('f8000000-0000-0000-0000-000000000006',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000002',
   'status_changed',
   'vehicle',
   'd0000000-0000-0000-0000-000000000001',
   '{"status": {"from": "intake_completed", "to": "in_service"}}'::jsonb,
   '{"source": "web_app"}'::jsonb,
   now() - interval '1 day'
  ),
  ('f8000000-0000-0000-0000-000000000007',
   'a0000000-0000-0000-0000-000000000001',
   'b0000000-0000-0000-0000-000000000003',
   'status_changed',
   'inspection',
   'f0000000-0000-0000-0000-000000000002',
   '{"status": {"from": "not_started", "to": "in_progress"}}'::jsonb,
   '{"source": "mobile_app"}'::jsonb,
   now() - interval '1 day'
  );

commit;
