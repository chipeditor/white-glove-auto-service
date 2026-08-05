-- Sprint 6: Extend audit_action enum with granular event types
-- These enable the event timeline, activity feeds, and future AI analytics

ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'vehicle_checked_in';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'technician_assigned';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'inspection_started';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'inspection_completed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'estimate_created';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'approval_sent';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'customer_approved';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'customer_declined';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'repair_started';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'repair_completed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'parts_requested';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'parts_received';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'qc_started';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'qc_passed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'ready_for_pickup';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'vehicle_delivered';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'photo_captured';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'note_added';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'pressure_test_completed';
ALTER TYPE audit_action ADD VALUE IF NOT EXISTS 'road_test_completed';
