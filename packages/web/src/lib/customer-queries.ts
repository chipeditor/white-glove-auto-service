/**
 * Server-side data access for the customer portal (`/customer/*`).
 *
 * Identity is resolved from the Supabase auth session only:
 *   auth user -> customers.user_id -> customers row -> that customer's data.
 *
 * Reads go through the service-role client because a customer may not hold an
 * active `memberships` row (RLS is org-membership based, so an unmembered
 * customer would silently read nothing). Every query below is therefore hard
 * scoped by the customer id / org id resolved from the verified session — the
 * caller can never widen it, and nothing here trusts client input.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase-server';
import type {
  Customer,
  Vehicle,
  ServiceRequest,
  ServiceRequestStatus,
  Inspection,
  InspectionSection,
  InspectionItem,
  Checklist,
  ChecklistItem,
  RepairOrderLine,
  ApprovalStatus,
} from '@/shared/types';

function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ===========================================
// Identity
// ===========================================

export interface CustomerOrganization {
  id: string;
  name: string;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export interface CustomerContext {
  customer: Customer;
  organization: CustomerOrganization | null;
}

/**
 * Resolve the signed-in customer. Returns null when there is no session or the
 * session's user has no `customers` row — callers must render a signed-out /
 * not-linked state rather than substituting any other identity.
 */
export async function getCustomerContext(): Promise<CustomerContext | null> {
  const authed = await createServerSupabaseClient();
  const {
    data: { user },
  } = await authed.auth.getUser();
  if (!user) return null;

  const db = adminClient();

  const { data: customer } = await db
    .from('customers')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!customer) return null;

  const { data: organization } = await db
    .from('organizations')
    .select('id, name, phone, address_line1, address_line2, city, state, zip')
    .eq('id', customer.organization_id)
    .maybeSingle();

  return {
    customer: customer as Customer,
    organization: (organization as CustomerOrganization | null) ?? null,
  };
}

export function customerInitials(fullName: string | null | undefined): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ===========================================
// Formatting helpers (shared by the pages)
// ===========================================

export function formatDateTime(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatRelative(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDateTime(iso);
}

export function vehicleName(v: Pick<Vehicle, 'year' | 'make' | 'model' | 'trim'>): string {
  return [v.year ?? null, v.make, v.model, v.trim].filter(Boolean).join(' ');
}

// ===========================================
// Pipeline derivation
// ===========================================

const PIPELINE_STAGES: { key: ServiceRequestStatus; label: string; description: string }[] = [
  { key: 'submitted', label: 'Service Request Received', description: 'Your vehicle and service request are checked in' },
  { key: 'awaiting_customer_approval', label: 'Your Approval', description: 'Review and approve the recommended work' },
  { key: 'approved', label: 'Approved', description: 'Work authorized — scheduling the repair' },
  { key: 'in_progress', label: 'In Service', description: 'Our technicians are working on your vehicle' },
  { key: 'quality_control', label: 'Quality Check', description: 'Final inspection before delivery' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', description: 'Schedule your pickup on the Delivery tab' },
  { key: 'completed', label: 'Delivered', description: 'Vehicle returned to you' },
];

const STATUS_RANK: Record<ServiceRequestStatus, number> = {
  draft: 0,
  submitted: 0,
  awaiting_customer_approval: 1,
  approved: 2,
  declined: 2,
  in_progress: 3,
  quality_control: 4,
  ready_for_delivery: 5,
  completed: 6,
};

/** Audit actions that mark a pipeline stage as reached, with a real timestamp. */
const ACTION_TO_STAGE: Record<string, ServiceRequestStatus> = {
  created: 'submitted',
  vehicle_checked_in: 'submitted',
  approval_sent: 'awaiting_customer_approval',
  customer_approved: 'approved',
  repair_started: 'in_progress',
  repair_completed: 'quality_control',
  qc_started: 'quality_control',
  qc_passed: 'ready_for_delivery',
  ready_for_pickup: 'ready_for_delivery',
  vehicle_delivered: 'completed',
};

export interface PipelineStep {
  key: string;
  label: string;
  description: string;
  at: string | null;
  state: 'done' | 'active' | 'upcoming';
}

function buildPipeline(
  status: ServiceRequestStatus,
  stageTimes: Record<string, string>
): PipelineStep[] {
  const rank = STATUS_RANK[status] ?? 0;
  return PIPELINE_STAGES.map((stage) => {
    const stageRank = STATUS_RANK[stage.key];
    const state: PipelineStep['state'] =
      status === 'completed' || stageRank < rank ? 'done' : stageRank === rank ? 'active' : 'upcoming';
    return {
      key: stage.key,
      label: stage.key === 'approved' && status === 'declined' ? 'Declined' : stage.label,
      description:
        stage.key === 'approved' && status === 'declined'
          ? 'You declined the recommended work'
          : stage.description,
      at: stageTimes[stage.key] ?? null,
      state,
    };
  });
}

// ===========================================
// Status page
// ===========================================

export interface CustomerAdvisor {
  full_name: string;
  phone: string | null;
  email: string | null;
}

export interface CustomerVehicleCard {
  vehicle: Vehicle;
  serviceRequest: ServiceRequest | null;
  advisor: CustomerAdvisor | null;
  pipeline: PipelineStep[];
  progressPercent: number;
}

export interface CustomerOverview extends CustomerContext {
  cards: CustomerVehicleCard[];
}

/** Every vehicle owned by the signed-in customer, with its newest service request. */
export async function fetchCustomerOverview(): Promise<CustomerOverview | null> {
  const context = await getCustomerContext();
  if (!context) return null;

  const db = adminClient();
  const { customer } = context;

  const { data: vehicles } = await db
    .from('vehicles')
    .select('*')
    .eq('customer_id', customer.id)
    .order('updated_at', { ascending: false });

  const vehicleList = (vehicles ?? []) as Vehicle[];
  if (vehicleList.length === 0) {
    return { ...context, cards: [] };
  }

  const { data: requests } = await db
    .from('service_requests')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false });

  const requestList = (requests ?? []) as ServiceRequest[];

  // Newest request per vehicle.
  const latestByVehicle = new Map<string, ServiceRequest>();
  for (const sr of requestList) {
    if (!latestByVehicle.has(sr.vehicle_id)) latestByVehicle.set(sr.vehicle_id, sr);
  }

  // Advisors — join users separately (RLS on users makes embedded joins unreliable).
  const advisorIds = [...new Set(requestList.map((r) => r.advisor_id).filter(Boolean))] as string[];
  const advisorById = new Map<string, CustomerAdvisor>();
  if (advisorIds.length > 0) {
    const { data: advisors } = await db
      .from('users')
      .select('id, full_name, phone, email')
      .in('id', advisorIds);
    for (const a of advisors ?? []) {
      advisorById.set(a.id, { full_name: a.full_name, phone: a.phone, email: a.email });
    }
  }

  // Real stage timestamps from the audit trail.
  const srIds = [...latestByVehicle.values()].map((r) => r.id);
  const stageTimesBySr = new Map<string, Record<string, string>>();
  if (srIds.length > 0) {
    const { data: events } = await db
      .from('audit_events')
      .select('action, entity_id, created_at')
      .eq('entity_type', 'service_request')
      .in('entity_id', srIds)
      .order('created_at', { ascending: true });

    for (const ev of events ?? []) {
      const stage = ACTION_TO_STAGE[ev.action as string];
      if (!stage) continue;
      const bucket = stageTimesBySr.get(ev.entity_id) ?? {};
      if (!bucket[stage]) bucket[stage] = ev.created_at;
      stageTimesBySr.set(ev.entity_id, bucket);
    }
  }

  const cards: CustomerVehicleCard[] = vehicleList.map((vehicle) => {
    const sr = latestByVehicle.get(vehicle.id) ?? null;
    const pipeline = sr ? buildPipeline(sr.status, stageTimesBySr.get(sr.id) ?? {}) : [];
    const done = pipeline.filter((s) => s.state === 'done').length;
    return {
      vehicle,
      serviceRequest: sr,
      advisor: sr?.advisor_id ? advisorById.get(sr.advisor_id) ?? null : null,
      pipeline,
      progressPercent: pipeline.length > 0 ? Math.round((done / pipeline.length) * 100) : 0,
    };
  });

  return { ...context, cards };
}

/** The service request the portal treats as "current": newest non-completed, else newest. */
export async function fetchActiveServiceRequest(
  db: SupabaseClient,
  customerId: string
): Promise<ServiceRequest | null> {
  const { data } = await db
    .from('service_requests')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });

  const list = (data ?? []) as ServiceRequest[];
  if (list.length === 0) return null;
  return list.find((r) => r.status !== 'completed') ?? list[0];
}

// ===========================================
// Updates / activity feed
// ===========================================

export type UpdateKind = 'notification' | 'event';

export interface CustomerUpdate {
  id: string;
  kind: UpdateKind;
  tone: 'accent' | 'blue' | 'green' | 'amber';
  title: string;
  body: string | null;
  from: string | null;
  at: string;
}

const EVENT_LABELS: Record<string, { title: string; tone: CustomerUpdate['tone'] }> = {
  vehicle_checked_in: { title: 'Vehicle Received', tone: 'accent' },
  inspection_started: { title: 'Inspection Started', tone: 'blue' },
  inspection_completed: { title: 'Inspection Complete', tone: 'green' },
  estimate_created: { title: 'Estimate Prepared', tone: 'accent' },
  approval_sent: { title: 'Estimate Sent for Your Approval', tone: 'amber' },
  customer_approved: { title: 'You Approved the Estimate', tone: 'green' },
  customer_declined: { title: 'You Declined the Estimate', tone: 'amber' },
  repair_started: { title: 'Service Started', tone: 'blue' },
  repair_completed: { title: 'Service Completed', tone: 'green' },
  parts_requested: { title: 'Parts Ordered', tone: 'blue' },
  parts_received: { title: 'Parts Received', tone: 'blue' },
  qc_started: { title: 'Quality Check Started', tone: 'blue' },
  qc_passed: { title: 'Quality Check Passed', tone: 'green' },
  ready_for_pickup: { title: 'Ready for Pickup', tone: 'accent' },
  vehicle_delivered: { title: 'Vehicle Delivered', tone: 'green' },
  status_changed: { title: 'Status Updated', tone: 'blue' },
};

export interface CustomerUpdatesView extends CustomerContext {
  updates: CustomerUpdate[];
}

export async function fetchCustomerUpdates(): Promise<CustomerUpdatesView | null> {
  const context = await getCustomerContext();
  if (!context) return null;

  const db = adminClient();
  const { customer } = context;

  const [{ data: srRows }, { data: vehicleRows }] = await Promise.all([
    db.from('service_requests').select('id, title').eq('customer_id', customer.id),
    db.from('vehicles').select('id').eq('customer_id', customer.id),
  ]);

  const srIds = (srRows ?? []).map((r) => r.id as string);
  const vehicleIds = (vehicleRows ?? []).map((v) => v.id as string);

  const updates: CustomerUpdate[] = [];

  // --- Notifications addressed to this customer's user account ---
  if (customer.user_id) {
    const { data: notifications } = await db
      .from('notifications')
      .select('id, title, body, created_at, type')
      .eq('user_id', customer.user_id)
      .order('created_at', { ascending: false })
      .limit(50);

    for (const n of notifications ?? []) {
      updates.push({
        id: `n:${n.id}`,
        kind: 'notification',
        tone: n.type === 'issue_flagged' ? 'amber' : n.type === 'approval_needed' ? 'accent' : 'blue',
        title: n.title,
        body: n.body,
        from: context.organization?.name ?? null,
        at: n.created_at,
      });
    }
  }

  // --- Audit trail for this customer's service requests and vehicles ---
  const entityIds = [...srIds, ...vehicleIds];
  if (entityIds.length > 0) {
    const { data: events } = await db
      .from('audit_events')
      .select('id, action, entity_type, entity_id, actor_id, changes, created_at')
      .in('entity_id', entityIds)
      .in('entity_type', ['service_request', 'vehicle'])
      .order('created_at', { ascending: false })
      .limit(50);

    const actorIds = [...new Set((events ?? []).map((e) => e.actor_id).filter(Boolean))] as string[];
    const actorById = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: actors } = await db.from('users').select('id, full_name').in('id', actorIds);
      for (const a of actors ?? []) actorById.set(a.id, a.full_name);
    }

    const titleBySr = new Map((srRows ?? []).map((r) => [r.id as string, r.title as string]));

    for (const ev of events ?? []) {
      const label = EVENT_LABELS[ev.action as string];
      if (!label) continue; // skip internal noise (created/updated/deleted)
      const changes = (ev.changes ?? {}) as Record<string, unknown>;
      const statusNote =
        ev.action === 'status_changed' && typeof changes.to === 'string'
          ? `Status changed to ${String(changes.to).replace(/_/g, ' ')}.`
          : null;
      updates.push({
        id: `e:${ev.id}`,
        kind: 'event',
        tone: label.tone,
        title: label.title,
        body: statusNote ?? titleBySr.get(ev.entity_id) ?? null,
        from: ev.actor_id ? actorById.get(ev.actor_id) ?? null : null,
        at: ev.created_at,
      });
    }
  }

  updates.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  return { ...context, updates };
}

// ===========================================
// Inspection
// ===========================================

export interface CustomerInspectionItem extends InspectionItem {
  photoCount: number;
}

export interface CustomerInspectionSection extends InspectionSection {
  items: CustomerInspectionItem[];
}

export interface CustomerApprovalView {
  id: string;
  token: string;
  status: ApprovalStatus;
  expires_at: string;
  responded_at: string | null;
  approved_line_ids: string[];
  declined_line_ids: string[];
  lines: RepairOrderLine[];
  expired: boolean;
  respondable: boolean;
}

export interface CustomerInspectionView extends CustomerContext {
  vehicle: Vehicle | null;
  serviceRequest: ServiceRequest | null;
  inspection: Inspection | null;
  inspectorName: string | null;
  sections: CustomerInspectionSection[];
  approval: CustomerApprovalView | null;
}

export async function fetchCustomerInspection(): Promise<CustomerInspectionView | null> {
  const context = await getCustomerContext();
  if (!context) return null;

  const db = adminClient();
  const { customer } = context;

  const serviceRequest = await fetchActiveServiceRequest(db, customer.id);

  const { data: vehicleRows } = await db
    .from('vehicles')
    .select('id')
    .eq('customer_id', customer.id);
  const vehicleIds = (vehicleRows ?? []).map((v) => v.id as string);

  const empty: CustomerInspectionView = {
    ...context,
    vehicle: null,
    serviceRequest,
    inspection: null,
    inspectorName: null,
    sections: [],
    approval: null,
  };

  if (vehicleIds.length === 0) return empty;

  // Prefer an inspection attached to the active service request.
  let inspection: Inspection | null = null;
  if (serviceRequest) {
    const { data } = await db
      .from('inspections')
      .select('*')
      .eq('service_request_id', serviceRequest.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    inspection = (data as Inspection | null) ?? null;
  }
  if (!inspection) {
    const { data } = await db
      .from('inspections')
      .select('*')
      .in('vehicle_id', vehicleIds)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    inspection = (data as Inspection | null) ?? null;
  }

  const approval = serviceRequest ? await fetchApprovalForRequest(db, serviceRequest.id) : null;

  if (!inspection) return { ...empty, approval };

  const { data: vehicle } = await db
    .from('vehicles')
    .select('*')
    .eq('id', inspection.vehicle_id)
    .maybeSingle();

  let inspectorName: string | null = null;
  if (inspection.inspector_id) {
    const { data: inspector } = await db
      .from('users')
      .select('full_name')
      .eq('id', inspection.inspector_id)
      .maybeSingle();
    inspectorName = inspector?.full_name ?? null;
  }

  const { data: sectionRows } = await db
    .from('inspection_sections')
    .select('*')
    .eq('inspection_id', inspection.id)
    .order('sort_order', { ascending: true });

  const sectionList = (sectionRows ?? []) as InspectionSection[];
  const sectionIds = sectionList.map((s) => s.id);

  let itemList: InspectionItem[] = [];
  if (sectionIds.length > 0) {
    const { data: itemRows } = await db
      .from('inspection_items')
      .select('*')
      .in('section_id', sectionIds)
      .order('sort_order', { ascending: true });
    itemList = (itemRows ?? []) as InspectionItem[];
  }

  // Photo counts per item.
  const photoCounts = new Map<string, number>();
  if (itemList.length > 0) {
    const { data: media } = await db
      .from('media_assets')
      .select('inspection_item_id')
      .in('inspection_item_id', itemList.map((i) => i.id));
    for (const m of media ?? []) {
      const key = m.inspection_item_id as string | null;
      if (!key) continue;
      photoCounts.set(key, (photoCounts.get(key) ?? 0) + 1);
    }
  }

  const sections: CustomerInspectionSection[] = sectionList.map((section) => ({
    ...section,
    items: itemList
      .filter((i) => i.section_id === section.id)
      .map((i) => ({ ...i, photoCount: photoCounts.get(i.id) ?? 0 })),
  }));

  return {
    ...context,
    vehicle: (vehicle as Vehicle | null) ?? null,
    serviceRequest,
    inspection,
    inspectorName,
    sections,
    approval,
  };
}

/**
 * The newest approval request for a service request, with its repair order
 * lines. This is the same `approval_requests` + `repair_order_lines` pair the
 * emailed `/approve/[token]` flow uses; the portal responds through the same
 * `/api/approvals/respond` endpoint.
 */
async function fetchApprovalForRequest(
  db: SupabaseClient,
  serviceRequestId: string
): Promise<CustomerApprovalView | null> {
  const { data: approval } = await db
    .from('approval_requests')
    .select('*')
    .eq('service_request_id', serviceRequestId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!approval) return null;

  const { data: lines } = await db
    .from('repair_order_lines')
    .select('*')
    .eq('service_request_id', serviceRequestId)
    .order('sort_order', { ascending: true });

  const expired = new Date(approval.expires_at) < new Date();
  const pending = approval.status === 'pending' || approval.status === 'viewed';

  return {
    id: approval.id,
    token: approval.token,
    status: approval.status as ApprovalStatus,
    expires_at: approval.expires_at,
    responded_at: approval.responded_at,
    approved_line_ids: approval.approved_line_ids ?? [],
    declined_line_ids: approval.declined_line_ids ?? [],
    lines: (lines ?? []) as RepairOrderLine[],
    expired,
    respondable: pending && !expired && (lines ?? []).length > 0,
  };
}

// ===========================================
// Delivery
// ===========================================

export interface CustomerChecklist extends Checklist {
  items: ChecklistItem[];
}

export interface CustomerAppointment {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  service_type: string;
}

export interface CustomerDeliveryView extends CustomerContext {
  vehicle: Vehicle | null;
  serviceRequest: ServiceRequest | null;
  ready: boolean;
  checklists: CustomerChecklist[];
  appointment: CustomerAppointment | null;
  /** Next business days offered for pickup, as ISO `yyyy-mm-dd`. */
  candidateDates: string[];
}

/** Next `count` weekdays starting tomorrow, in ISO date form. */
function upcomingWeekdays(count: number): string[] {
  const out: string[] = [];
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  while (out.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const dow = cursor.getDay();
    if (dow === 0) continue; // closed Sunday
    out.push(cursor.toISOString().slice(0, 10));
  }
  return out;
}

export async function fetchCustomerDelivery(): Promise<CustomerDeliveryView | null> {
  const context = await getCustomerContext();
  if (!context) return null;

  const db = adminClient();
  const { customer } = context;

  const serviceRequest = await fetchActiveServiceRequest(db, customer.id);

  let vehicle: Vehicle | null = null;
  if (serviceRequest) {
    const { data } = await db
      .from('vehicles')
      .select('*')
      .eq('id', serviceRequest.vehicle_id)
      .maybeSingle();
    vehicle = (data as Vehicle | null) ?? null;
  } else {
    const { data } = await db
      .from('vehicles')
      .select('*')
      .eq('customer_id', customer.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    vehicle = (data as Vehicle | null) ?? null;
  }

  const ready =
    serviceRequest?.status === 'ready_for_delivery' ||
    serviceRequest?.status === 'completed' ||
    vehicle?.status === 'ready_for_delivery' ||
    vehicle?.status === 'delivered';

  // Pre-delivery checklists, real items only.
  let checklists: CustomerChecklist[] = [];
  if (serviceRequest || vehicle) {
    let query = db.from('checklists').select('*');
    query = serviceRequest
      ? query.eq('service_request_id', serviceRequest.id)
      : query.eq('vehicle_id', vehicle!.id);
    const { data: checklistRows } = await query.order('created_at', { ascending: true });

    const list = (checklistRows ?? []) as Checklist[];
    if (list.length > 0) {
      const { data: itemRows } = await db
        .from('checklist_items')
        .select('*')
        .in('checklist_id', list.map((c) => c.id))
        .order('sort_order', { ascending: true });
      const items = (itemRows ?? []) as ChecklistItem[];
      checklists = list.map((c) => ({
        ...c,
        items: items.filter((i) => i.checklist_id === c.id),
      }));
    }
  }

  // Existing pickup appointment, if the customer already booked one.
  const { data: appointmentRow } = await db
    .from('appointments')
    .select('id, scheduled_date, scheduled_time, status, service_type')
    .eq('customer_id', customer.id)
    .not('status', 'in', '("cancelled","no_show")')
    .gte('scheduled_date', new Date().toISOString().slice(0, 10))
    .order('scheduled_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  return {
    ...context,
    vehicle,
    serviceRequest,
    ready: Boolean(ready),
    checklists,
    appointment: (appointmentRow as CustomerAppointment | null) ?? null,
    candidateDates: upcomingWeekdays(3),
  };
}
