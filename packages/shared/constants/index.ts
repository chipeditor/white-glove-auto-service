// White Glove Auto Service — Shared Constants

import type {
  VehicleStatus,
  ServiceRequestStatus,
  InspectionStatus,
  NotificationType,
  UserRole,
} from '../types';

// ===========================================
// Status Display Maps
// ===========================================

export const VEHICLE_STATUS_LABELS: Record<VehicleStatus, string> = {
  intake_started: 'Intake Started',
  intake_completed: 'Intake Completed',
  in_service: 'In Service',
  awaiting_approval: 'Awaiting Approval',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  archived: 'Archived',
};

export const VEHICLE_STATUS_COLORS: Record<VehicleStatus, string> = {
  intake_started: 'blue',
  intake_completed: 'cyan',
  in_service: 'green',
  awaiting_approval: 'amber',
  ready_for_delivery: 'emerald',
  delivered: 'slate',
  archived: 'gray',
};

export const SERVICE_REQUEST_STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  awaiting_customer_approval: 'Awaiting Approval',
  approved: 'Approved',
  declined: 'Declined',
  in_progress: 'In Progress',
  quality_control: 'Quality Control',
  ready_for_delivery: 'Ready for Delivery',
  completed: 'Completed',
};

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
  needs_attention: 'Needs Attention',
  signed_off: 'Signed Off',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  shop_admin: 'Shop Admin',
  service_advisor: 'Service Advisor',
  technician: 'Technician',
  delivery_specialist: 'Delivery Specialist',
  customer: 'Customer',
};

// ===========================================
// Vehicle Status Pipeline (ordered)
// ===========================================

export const VEHICLE_STATUS_PIPELINE: VehicleStatus[] = [
  'intake_started',
  'intake_completed',
  'in_service',
  'awaiting_approval',
  'ready_for_delivery',
  'delivered',
];

// ===========================================
// Intake Wizard Steps
// ===========================================

export const INTAKE_STEPS = [
  { key: 'vehicle', label: 'Vehicle', number: 1 },
  { key: 'customer', label: 'Customer', number: 2 },
  { key: 'service', label: 'Service', number: 3 },
  { key: 'inspection', label: 'Inspection', number: 4 },
] as const;

// ===========================================
// Default Inspection Sections
// ===========================================

export const DEFAULT_INTAKE_SECTIONS = [
  'Exterior Front',
  'Exterior Rear',
  'Driver Side',
  'Passenger Side',
  'Wheels & Tires',
  'Glass & Lights',
  'Interior',
  'Engine Bay',
  'Warning Lights',
  'Final Notes',
];

export const DEFAULT_MECHANICAL_ITEMS: Record<string, string[]> = {
  'Engine & Performance': [
    'Check engine oil level',
    'Inspect belts and hoses',
    'Spark plugs condition',
    'Air filter inspection',
  ],
  'Brakes': [
    'Brake pad thickness',
    'Rotor condition',
    'Brake fluid level',
  ],
  'Suspension & Steering': [
    'Shock absorber condition',
    'Steering responsiveness',
    'Alignment check',
  ],
  'Electrical': [
    'Battery condition',
    'Alternator output',
    'Starter operation',
    'Lighting systems',
  ],
  'Fluids': [
    'Coolant level',
    'Transmission fluid',
    'Power steering fluid',
    'Windshield washer fluid',
  ],
};

export const DEFAULT_DELIVERY_CHECKLIST = [
  'Exterior wash and detail complete',
  'Interior cleaning complete',
  'All personal items returned',
  'Fluid levels verified',
  'Tire pressure set to spec',
  'All service items completed',
  'Test drive completed',
  'No warning lights active',
  'Customer paperwork prepared',
  'Vehicle photos taken',
  'Keys and accessories accounted for',
  'Final quality inspection passed',
];

// ===========================================
// Notification Templates
// ===========================================

export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  { title: string; body: string }
> = {
  intake_started: {
    title: 'Intake Started',
    body: 'Your {vehicle} intake has begun. We\'ll keep you updated on every step.',
  },
  intake_completed: {
    title: 'Intake Complete',
    body: 'Your {vehicle} intake inspection is complete and ready for review.',
  },
  approval_needed: {
    title: 'Approval Needed',
    body: 'Additional approval is needed for recommended repairs on your {vehicle}.',
  },
  approval_received: {
    title: 'Approval Received',
    body: 'Thank you for approving the service plan for your {vehicle}. Work will begin shortly.',
  },
  service_started: {
    title: 'Service Started',
    body: 'We\'ve started working on your {vehicle}. You\'ll be notified when it\'s ready.',
  },
  service_completed: {
    title: 'Service Complete',
    body: 'All service work on your {vehicle} has been completed. Quality check is underway.',
  },
  delivery_ready: {
    title: 'Ready for Pickup',
    body: 'Great news — your {vehicle} is ready for pickup. Contact us to schedule.',
  },
  vehicle_delivered: {
    title: 'Delivery Complete',
    body: 'Your {vehicle} has been delivered. Thank you for choosing White Glove.',
  },
  issue_flagged: {
    title: 'Issue Flagged',
    body: 'Our technician flagged an item during inspection of your {vehicle}. Please review.',
  },
  report_ready: {
    title: 'Report Ready',
    body: 'Your inspection report for the {vehicle} is ready to view.',
  },
};
