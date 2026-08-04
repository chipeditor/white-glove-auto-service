-- =============================================================================
-- Sprint 2 Seed Data — Canned Jobs & Sample Repair Order Lines
-- =============================================================================
-- Run after 00003_repair_orders.sql migration.
-- Uses org ID from original seed: a0000000-0000-0000-0000-000000000001

begin;

-- ===========================================
-- Canned Jobs
-- ===========================================
insert into canned_jobs (id, organization_id, name, description, category, labor_hours, labor_rate, parts_cost, total_estimate, sort_order) values
  ('ca000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'Full Synthetic Oil Change', 'Drain and replace engine oil with full synthetic. Replace oil filter. Check fluid levels.',
   'Maintenance', 0.50, 150.00, 45.00, 120.00, 1),

  ('ca000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001',
   'Brake Pad Replacement (Front)', 'Remove front wheels, replace brake pads, inspect rotors, test braking.',
   'Brakes', 1.50, 150.00, 180.00, 405.00, 2),

  ('ca000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001',
   'Brake Pad Replacement (Rear)', 'Remove rear wheels, replace brake pads, inspect rotors, test braking.',
   'Brakes', 1.50, 150.00, 160.00, 385.00, 3),

  ('ca000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001',
   'Tire Rotation & Balance', 'Rotate all four tires, balance wheels, check tire pressure and tread depth.',
   'Maintenance', 0.75, 150.00, 0.00, 112.50, 4),

  ('ca000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001',
   'A/C System Recharge', 'Evacuate and recharge A/C system. Inspect for leaks. Test cooling output.',
   'Climate', 1.00, 150.00, 65.00, 215.00, 5),

  ('ca000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001',
   'Battery Replacement', 'Test and replace battery. Clean terminals. Verify charging system.',
   'Electrical', 0.50, 150.00, 220.00, 295.00, 6),

  ('ca000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001',
   'Wheel Alignment (4-Wheel)', 'Computer-guided 4-wheel alignment. Adjust camber, caster, and toe.',
   'Suspension', 1.00, 150.00, 0.00, 150.00, 7),

  ('ca000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001',
   'Spark Plug Replacement', 'Remove and replace spark plugs. Inspect ignition coils and wires.',
   'Engine', 1.50, 150.00, 80.00, 305.00, 8),

  ('ca000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001',
   'Coolant Flush', 'Drain old coolant, flush system, refill with manufacturer-spec coolant.',
   'Maintenance', 1.00, 150.00, 35.00, 185.00, 9),

  ('ca000000-0000-0000-0000-00000000000a', 'a0000000-0000-0000-0000-000000000001',
   'Transmission Fluid Service', 'Drain and replace transmission fluid. Replace filter if applicable.',
   'Drivetrain', 1.50, 150.00, 90.00, 315.00, 10),

  ('ca000000-0000-0000-0000-00000000000b', 'a0000000-0000-0000-0000-000000000001',
   'Multi-Point Inspection', 'Comprehensive vehicle inspection covering brakes, suspension, fluids, tires, belts, and hoses.',
   'Inspection', 1.00, 150.00, 0.00, 150.00, 11),

  ('ca000000-0000-0000-0000-00000000000c', 'a0000000-0000-0000-0000-000000000001',
   'Cabin Air Filter Replacement', 'Remove and replace cabin air filter.',
   'Maintenance', 0.25, 150.00, 30.00, 67.50, 12)
on conflict (id) do nothing;

-- ===========================================
-- Sample Repair Order Lines for Corvette SR
-- ===========================================
insert into repair_order_lines (id, service_request_id, organization_id, line_type, description, quantity, unit_price, status, sort_order) values
  ('fa000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'labor', 'Full synthetic oil change — drain, replace filter, refill', 1, 75.00, 'approved', 1),
  ('fa000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'parts', 'Mobil 1 Full Synthetic 5W-30 (8 qt)', 1, 65.00, 'approved', 2),
  ('fa000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'parts', 'OEM Oil Filter', 1, 18.00, 'approved', 3),
  ('fa000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'labor', 'Front brake pad replacement — remove wheels, install pads, inspect rotors', 1, 225.00, 'pending', 4),
  ('fa000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001',
   'parts', 'Performance ceramic brake pads (front set)', 1, 189.00, 'pending', 5)
on conflict (id) do nothing;

commit;
