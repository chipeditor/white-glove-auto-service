import { createServerSupabaseClient } from './supabase-server';
import type {
  Vehicle,
  VehicleWithCustomer,
  Customer,
  ServiceRequest,
  ServiceRequestWithVehicle,
  ServiceRequestWithDetails,
  RepairOrderLine,
  Inspection,
  InspectionSection,
  InspectionItem,
  Checklist,
  ChecklistItem,
  Notification,
  AffiliateRecommendation,
  User,
} from '@/shared/types';

async function getOrgId() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  return membership?.organization_id ?? null;
}

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile as User | null;
}

export async function fetchVehicles(): Promise<VehicleWithCustomer[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('organization_id', orgId)
    .order('updated_at', { ascending: false });

  return (vehicles ?? []) as VehicleWithCustomer[];
}

export async function fetchVehicle(id: string): Promise<VehicleWithCustomer | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('vehicles')
    .select('*, customer:customers(*)')
    .eq('id', id)
    .single();

  return data as VehicleWithCustomer | null;
}

export async function fetchDashboardStats() {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return null;

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('status')
    .eq('organization_id', orgId);

  if (!vehicles) return null;

  const counts = {
    vehicles_in_service: 0,
    ready_for_delivery: 0,
    awaiting_approval: 0,
    completed_this_week: 0,
  };

  for (const v of vehicles) {
    if (v.status === 'in_service') counts.vehicles_in_service++;
    if (v.status === 'ready_for_delivery') counts.ready_for_delivery++;
    if (v.status === 'awaiting_approval') counts.awaiting_approval++;
    if (v.status === 'delivered') counts.completed_this_week++;
  }

  return counts;
}

export async function fetchServiceRequests(): Promise<ServiceRequestWithVehicle[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*), technician:users!service_requests_technician_id_fkey(*)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  return (data ?? []) as ServiceRequestWithVehicle[];
}

export async function fetchServiceRequest(id: string): Promise<ServiceRequestWithDetails | null> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('service_requests')
    .select('*, vehicle:vehicles(*), customer:customers(*), advisor:users!service_requests_advisor_id_fkey(*), technician:users!service_requests_technician_id_fkey(*)')
    .eq('id', id)
    .single();

  if (!data) return null;

  const [inspections, checklists, lines] = await Promise.all([
    supabase.from('inspections').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
    supabase.from('checklists').select('*').eq('service_request_id', id).order('created_at', { ascending: false }),
    supabase.from('repair_order_lines').select('*').eq('service_request_id', id).order('sort_order'),
  ]);

  return {
    ...data,
    inspections: inspections.data ?? [],
    checklists: checklists.data ?? [],
    lines: lines.data ?? [],
  } as ServiceRequestWithDetails;
}

export async function fetchOrgUsers(): Promise<User[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data: memberships } = await supabase
    .from('memberships')
    .select('user_id, users(*)')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  return (memberships ?? []).map((m: Record<string, unknown>) => m.users).filter(Boolean) as User[];
}

export async function fetchInspections(vehicleId: string): Promise<Inspection[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('inspections')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Inspection[];
}

export async function fetchInspectionSections(
  inspectionId: string
): Promise<(InspectionSection & { items: InspectionItem[] })[]> {
  const supabase = await createServerSupabaseClient();

  const { data: sections } = await supabase
    .from('inspection_sections')
    .select('*, items:inspection_items(*)')
    .eq('inspection_id', inspectionId)
    .order('sort_order');

  return (sections ?? []) as (InspectionSection & { items: InspectionItem[] })[];
}

export async function fetchChecklists(vehicleId: string): Promise<(Checklist & { items: ChecklistItem[] })[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('checklists')
    .select('*, items:checklist_items(*)')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false });

  return (data ?? []) as (Checklist & { items: ChecklistItem[] })[];
}

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data ?? []) as Notification[];
}

export async function fetchCustomers(): Promise<Customer[]> {
  const supabase = await createServerSupabaseClient();
  const orgId = await getOrgId();
  if (!orgId) return [];

  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('organization_id', orgId)
    .order('full_name');

  return (data ?? []) as Customer[];
}

export async function fetchAffiliateRecommendations(
  vehicleId: string
): Promise<AffiliateRecommendation[]> {
  const supabase = await createServerSupabaseClient();

  const { data } = await supabase
    .from('affiliate_recommendations')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .eq('is_active', true);

  return (data ?? []) as AffiliateRecommendation[];
}
