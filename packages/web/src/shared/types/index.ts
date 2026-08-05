// White Glove Auto Service — Shared TypeScript Types

// ===========================================
// Enums
// ===========================================

export type UserRole =
  | 'super_admin'
  | 'shop_admin'
  | 'service_advisor'
  | 'technician'
  | 'delivery_specialist'
  | 'customer';

export type VehicleStatus =
  | 'intake_started'
  | 'intake_completed'
  | 'in_service'
  | 'awaiting_approval'
  | 'ready_for_delivery'
  | 'delivered'
  | 'archived';

export type ServiceRequestStatus =
  | 'draft'
  | 'submitted'
  | 'awaiting_customer_approval'
  | 'approved'
  | 'declined'
  | 'in_progress'
  | 'quality_control'
  | 'ready_for_delivery'
  | 'completed';

export type InspectionStatus =
  | 'not_started'
  | 'in_progress'
  | 'completed'
  | 'needs_attention'
  | 'signed_off';

export type InspectionType =
  | 'intake'
  | 'mechanical'
  | 'cosmetic'
  | 'delivery'
  | 'quality_control'
  | 'spot_check';

export type MediaType = 'photo' | 'video' | 'document';

export type NotificationType =
  | 'intake_started'
  | 'intake_completed'
  | 'approval_needed'
  | 'approval_received'
  | 'service_started'
  | 'service_completed'
  | 'delivery_ready'
  | 'vehicle_delivered'
  | 'issue_flagged'
  | 'report_ready';

export type DamageSeverity = 'minor' | 'moderate' | 'severe';

export type AuditAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'status_changed'
  | 'assigned'
  | 'signed'
  | 'uploaded'
  | 'approved'
  | 'declined'
  | 'flagged'
  | 'vehicle_checked_in'
  | 'technician_assigned'
  | 'inspection_started'
  | 'inspection_completed'
  | 'estimate_created'
  | 'approval_sent'
  | 'customer_approved'
  | 'customer_declined'
  | 'repair_started'
  | 'repair_completed'
  | 'parts_requested'
  | 'parts_received'
  | 'qc_started'
  | 'qc_passed'
  | 'ready_for_pickup'
  | 'vehicle_delivered'
  | 'photo_captured'
  | 'note_added'
  | 'pressure_test_completed'
  | 'road_test_completed';

// ===========================================
// Base
// ===========================================

export interface Timestamps {
  created_at: string;
  updated_at: string;
}

// ===========================================
// Entities
// ===========================================

export interface Organization extends Timestamps {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
}

export interface User extends Timestamps {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  default_role: UserRole;
}

export interface Membership extends Timestamps {
  id: string;
  user_id: string;
  organization_id: string;
  role: UserRole;
  is_active: boolean;
}

export interface Customer extends Timestamps {
  id: string;
  organization_id: string;
  user_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  notes: string | null;
}

export interface Vehicle extends Timestamps {
  id: string;
  organization_id: string;
  customer_id: string | null;
  vin: string | null;
  year: number | null;
  make: string;
  model: string;
  trim: string | null;
  color: string | null;
  license_plate: string | null;
  state: string | null;
  mileage: number | null;
  engine: string | null;
  transmission: string | null;
  drivetrain: string | null;
  photo_url: string | null;
  status: VehicleStatus;
  notes: string | null;
}

export interface ServiceRequest extends Timestamps {
  id: string;
  organization_id: string;
  vehicle_id: string;
  customer_id: string | null;
  advisor_id: string | null;
  title: string;
  description: string | null;
  technician_id: string | null;
  status: ServiceRequestStatus;
  priority: number;
  estimated_completion: string | null;
  actual_completion: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
}

export interface Inspection extends Timestamps {
  id: string;
  organization_id: string;
  vehicle_id: string;
  service_request_id: string | null;
  inspector_id: string | null;
  type: InspectionType;
  status: InspectionStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface InspectionSection extends Timestamps {
  id: string;
  inspection_id: string;
  name: string;
  sort_order: number;
  status: InspectionStatus;
  notes: string | null;
}

export interface InspectionItem extends Timestamps {
  id: string;
  section_id: string;
  label: string;
  sort_order: number;
  passed: boolean | null;
  value: string | null;
  notes: string | null;
  flagged: boolean;
}

export interface MediaAsset {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  inspection_id: string | null;
  inspection_item_id: string | null;
  uploaded_by: string | null;
  type: MediaType;
  storage_path: string;
  url: string;
  thumbnail_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  caption: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DamageMarker extends Timestamps {
  id: string;
  inspection_id: string;
  section_id: string | null;
  media_asset_id: string | null;
  x_position: number | null;
  y_position: number | null;
  label: string | null;
  description: string | null;
  severity: DamageSeverity;
}

export interface Checklist extends Timestamps {
  id: string;
  organization_id: string;
  vehicle_id: string;
  service_request_id: string | null;
  assigned_to: string | null;
  title: string;
  description: string | null;
  total_items: number;
  completed_items: number;
}

export interface ChecklistItem extends Timestamps {
  id: string;
  checklist_id: string;
  label: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
}

export interface Signature {
  id: string;
  organization_id: string;
  vehicle_id: string;
  service_request_id: string | null;
  signer_id: string | null;
  signer_name: string;
  signer_role: string | null;
  signature_data: string | null;
  signed_at: string;
  ip_address: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  vehicle_id: string | null;
  service_request_id: string | null;
  read: boolean;
  read_at: string | null;
  action_url: string | null;
  created_at: string;
}

export interface AffiliateRecommendation {
  id: string;
  organization_id: string;
  vehicle_id: string | null;
  inspection_item_id: string | null;
  title: string;
  description: string | null;
  product_url: string | null;
  image_url: string | null;
  price: number | null;
  affiliate_tag: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Report extends Timestamps {
  id: string;
  organization_id: string;
  vehicle_id: string;
  service_request_id: string | null;
  title: string;
  type: string;
  status: string;
  pdf_url: string | null;
  generated_at: string | null;
}

export interface AuditEvent {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ===========================================
// Joined / View Types
// ===========================================

export interface VehicleWithCustomer extends Vehicle {
  customer: Customer | null;
}

export interface InspectionWithSections extends Inspection {
  sections: (InspectionSection & { items: InspectionItem[] })[];
}

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

export type LineItemType = 'labor' | 'parts' | 'sublet' | 'fee' | 'discount';
export type LineItemStatus = 'pending' | 'approved' | 'declined' | 'in_progress' | 'completed';

export interface RepairOrderLine extends Timestamps {
  id: string;
  service_request_id: string;
  organization_id: string;
  canned_job_id: string | null;
  inspection_item_id: string | null;
  line_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total: number;
  status: LineItemStatus;
  technician_id: string | null;
  sort_order: number;
  notes: string | null;
}

export interface ServiceRequestWithVehicle extends ServiceRequest {
  vehicle: Vehicle;
  customer: Customer | null;
  technician: User | null;
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  vehicle: Vehicle;
  customer: Customer | null;
  advisor: User | null;
  technician: User | null;
  inspections: Inspection[];
  checklists: Checklist[];
  lines: RepairOrderLine[];
}

export type ApprovalStatus = 'pending' | 'viewed' | 'approved' | 'partially_approved' | 'declined';
export type SmsDirection = 'outbound' | 'inbound';
export type SmsStatus = 'queued' | 'sent' | 'delivered' | 'failed' | 'received';

export interface ApprovalRequest extends Timestamps {
  id: string;
  organization_id: string;
  service_request_id: string;
  customer_id: string | null;
  token: string;
  status: ApprovalStatus;
  expires_at: string;
  viewed_at: string | null;
  responded_at: string | null;
  customer_comments: string | null;
  approved_line_ids: string[];
  declined_line_ids: string[];
  created_by: string | null;
}

export interface SmsMessage {
  id: string;
  organization_id: string;
  customer_id: string | null;
  service_request_id: string | null;
  direction: SmsDirection;
  from_number: string;
  to_number: string;
  body: string;
  status: SmsStatus;
  twilio_sid: string | null;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface DeclinedJob {
  id: string;
  organization_id: string;
  customer_id: string;
  vehicle_id: string;
  service_request_id: string;
  repair_order_line_id: string;
  description: string;
  unit_price: number;
  reason: string | null;
  re_recommended: boolean;
  created_at: string;
}

export interface VehicleDetail extends Vehicle {
  customer: Customer | null;
  service_requests: ServiceRequest[];
  inspections: Inspection[];
  media: MediaAsset[];
}
