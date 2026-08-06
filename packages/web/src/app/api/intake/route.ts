import { createServerSupabaseClient } from '@/lib/supabase-server';
import { emitEvent } from '@/lib/events';
import { sendEmail, vehicleCheckedInEmail } from '@/lib/email';

const INTAKE_SECTIONS = [
  { name: 'Exterior Front', items: ['Hood', 'Bumper', 'Grille', 'Headlights', 'Windshield'] },
  { name: 'Exterior Rear', items: ['Trunk/Hatch', 'Bumper', 'Taillights', 'Exhaust', 'Rear Glass'] },
  { name: 'Driver Side', items: ['Front Fender', 'Door', 'Mirror', 'Rear Quarter', 'Rocker Panel'] },
  { name: 'Passenger Side', items: ['Front Fender', 'Door', 'Mirror', 'Rear Quarter', 'Rocker Panel'] },
  { name: 'Wheels & Tires', items: ['LF Tire/Wheel', 'RF Tire/Wheel', 'LR Tire/Wheel', 'RR Tire/Wheel', 'Spare'] },
  { name: 'Glass & Lights', items: ['Windshield', 'Rear Window', 'Side Windows', 'All Lights Working', 'Turn Signals'] },
  { name: 'Interior', items: ['Seats', 'Dashboard', 'Steering Wheel', 'Center Console', 'Carpet/Mats', 'Headliner'] },
  { name: 'Engine Bay', items: ['Oil Level', 'Coolant Level', 'Brake Fluid', 'Battery', 'Belts & Hoses', 'Air Filter'] },
  { name: 'Warning Lights', items: ['Check Engine', 'ABS', 'Airbag', 'TPMS', 'Oil Pressure', 'Battery'] },
  { name: 'Final Notes', items: ['Overall Condition', 'Customer Concerns', 'Recommendations'] },
];

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: membership } = await supabase
    .from('memberships')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!membership) {
    return Response.json({ error: 'No organization' }, { status: 403 });
  }

  const orgId = membership.organization_id;
  const body = await request.json();

  // 1. Use existing customer or create new one
  let customerId: string | null = body.customerId || null;
  if (!customerId && body.customerName?.trim()) {
    const { data: customer, error: custErr } = await supabase
      .from('customers')
      .insert({
        organization_id: orgId,
        full_name: body.customerName.trim(),
        email: body.customerEmail?.trim() || null,
        phone: body.customerPhone?.trim() || null,
      })
      .select('id')
      .single();

    if (custErr) {
      return Response.json({ error: 'Failed to create customer: ' + custErr.message }, { status: 500 });
    }
    customerId = customer.id;
  }

  // 2. Create vehicle
  const { data: vehicle, error: vehErr } = await supabase
    .from('vehicles')
    .insert({
      organization_id: orgId,
      customer_id: customerId,
      vin: body.vin?.trim() || null,
      year: body.year ? parseInt(body.year) : null,
      make: body.make?.trim() || 'Unknown',
      model: body.model?.trim() || 'Unknown',
      trim: body.trim?.trim() || null,
      color: body.color?.trim() || null,
      license_plate: body.plate?.trim() || null,
      state: body.plateState?.trim() || null,
      mileage: body.mileage ? parseInt(body.mileage.replace(/,/g, '')) : null,
      status: 'intake_started',
    })
    .select('id')
    .single();

  if (vehErr) {
    return Response.json({ error: 'Failed to create vehicle: ' + vehErr.message }, { status: 500 });
  }

  // 3. Create service request
  const title = `${body.serviceType || 'Service'} — ${body.make || ''} ${body.model || ''}`.trim();
  const { data: sr, error: srErr } = await supabase
    .from('service_requests')
    .insert({
      organization_id: orgId,
      vehicle_id: vehicle.id,
      customer_id: customerId,
      advisor_id: user.id,
      title,
      description: body.description?.trim() || null,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (srErr) {
    return Response.json({ error: 'Failed to create service request: ' + srErr.message }, { status: 500 });
  }

  // 4. Create inspection with sections and items
  const inspType = body.inspectionType || 'intake';
  const { data: inspection, error: inspErr } = await supabase
    .from('inspections')
    .insert({
      organization_id: orgId,
      vehicle_id: vehicle.id,
      service_request_id: sr.id,
      inspector_id: user.id,
      type: inspType,
      status: 'not_started',
    })
    .select('id')
    .single();

  if (inspErr) {
    return Response.json({ error: 'Failed to create inspection: ' + inspErr.message }, { status: 500 });
  }

  // 5. Create inspection sections and items
  for (let i = 0; i < INTAKE_SECTIONS.length; i++) {
    const sec = INTAKE_SECTIONS[i];
    const { data: section } = await supabase
      .from('inspection_sections')
      .insert({
        inspection_id: inspection.id,
        name: sec.name,
        sort_order: i,
        status: 'not_started',
      })
      .select('id')
      .single();

    if (section) {
      const items = sec.items.map((label, j) => ({
        section_id: section.id,
        label,
        sort_order: j,
        passed: null,
        flagged: false,
      }));
      await supabase.from('inspection_items').insert(items);
    }
  }

  await emitEvent({
    action: 'created',
    entityType: 'service_request',
    entityId: sr.id,
    organizationId: orgId,
    actorId: user.id,
    metadata: { source: 'intake_wizard', vehicleId: vehicle.id, inspectionId: inspection.id },
  });

  await emitEvent({
    action: 'vehicle_checked_in',
    entityType: 'vehicle',
    entityId: vehicle.id,
    organizationId: orgId,
    actorId: user.id,
    changes: { make: body.make, model: body.model, year: body.year, vin: body.vin },
  });

  // Email customer confirming vehicle check-in
  if (body.customerEmail?.trim()) {
    const { data: org } = await supabase.from('organizations').select('name, phone').eq('id', orgId).single();
    const vehicleName = `${body.year || ''} ${body.make || ''} ${body.model || ''}`.trim() || 'Your vehicle';
    await sendEmail({
      to: body.customerEmail.trim(),
      subject: `Vehicle Received — ${vehicleName}`,
      html: vehicleCheckedInEmail({
        customerName: body.customerName?.trim() || 'Valued Customer',
        vehicleName,
        shopName: org?.name,
        shopPhone: org?.phone,
      }),
    });
  }

  return Response.json({
    serviceRequestId: sr.id,
    vehicleId: vehicle.id,
    inspectionId: inspection.id,
    customerId,
  });
}
