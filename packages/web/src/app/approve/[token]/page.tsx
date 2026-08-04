import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import { ApprovalForm } from './approval-form';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export default async function ApprovalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = getAdminClient();

  const { data: approval } = await supabase
    .from('approval_requests')
    .select('*')
    .eq('token', token)
    .single();

  if (!approval) notFound();

  const expired = new Date(approval.expires_at) < new Date();
  const alreadyResponded = approval.status !== 'pending' && approval.status !== 'viewed';

  const { data: sr } = await supabase
    .from('service_requests')
    .select('id, title, subtotal, tax_rate, tax_amount, total, vehicle_id')
    .eq('id', approval.service_request_id)
    .single();

  let vehicle = null;
  if (sr?.vehicle_id) {
    const { data: v } = await supabase
      .from('vehicles')
      .select('year, make, model, trim, color')
      .eq('id', sr.vehicle_id)
      .single();
    vehicle = v;
  }

  let customer = null;
  if (approval.customer_id) {
    const { data: c } = await supabase
      .from('customers')
      .select('full_name')
      .eq('id', approval.customer_id)
      .single();
    customer = c;
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('name, phone')
    .eq('id', approval.organization_id)
    .single();

  const { data: lines } = await supabase
    .from('repair_order_lines')
    .select('*')
    .eq('service_request_id', approval.service_request_id)
    .order('sort_order');

  if (approval.status === 'pending') {
    await supabase
      .from('approval_requests')
      .update({ status: 'viewed', viewed_at: new Date().toISOString() })
      .eq('id', approval.id);
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Service Estimate</h1>
          {org && <p className="text-sm text-[#9ca3af] mt-1">{org.name}</p>}
        </div>

        {/* Vehicle & Customer */}
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-5 mb-4">
          {vehicle && (
            <p className="text-white font-medium">
              {vehicle.year} {vehicle.make} {vehicle.model}
              {vehicle.trim && <span className="text-[#9ca3af] ml-1">{vehicle.trim}</span>}
            </p>
          )}
          {customer && (
            <p className="text-sm text-[#9ca3af] mt-1">Prepared for {customer.full_name}</p>
          )}
          {sr && (
            <p className="text-sm text-[#9ca3af] mt-1">{sr.title}</p>
          )}
        </div>

        {expired ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">This approval link has expired.</p>
            <p className="text-sm text-[#9ca3af] mt-2">
              Please contact {org?.name || 'the service center'}{org?.phone ? ` at ${org.phone}` : ''} for a new estimate.
            </p>
          </div>
        ) : alreadyResponded ? (
          <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-6 text-center">
            <p className="text-white font-medium">
              {approval.status === 'approved' && 'You approved this estimate.'}
              {approval.status === 'declined' && 'You declined this estimate.'}
              {approval.status === 'partially_approved' && 'You partially approved this estimate.'}
            </p>
            {approval.responded_at && (
              <p className="text-sm text-[#9ca3af] mt-2">
                Responded on {new Date(approval.responded_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                })}
              </p>
            )}
            {approval.approved_line_ids?.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider mb-2">Approved Items</p>
                {lines?.filter(l => approval.approved_line_ids.includes(l.id)).map(l => (
                  <div key={l.id} className="flex justify-between py-1">
                    <span className="text-sm text-green-400">{l.description}</span>
                    <span className="text-sm text-green-400">${l.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {approval.declined_line_ids?.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs text-[#9ca3af] uppercase tracking-wider mb-2">Declined Items</p>
                {lines?.filter(l => approval.declined_line_ids.includes(l.id)).map(l => (
                  <div key={l.id} className="flex justify-between py-1">
                    <span className="text-sm text-red-400 line-through">{l.description}</span>
                    <span className="text-sm text-red-400 line-through">${l.total.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <ApprovalForm
            token={token}
            lines={lines || []}
            subtotal={sr?.subtotal || 0}
            taxRate={sr?.tax_rate || 0}
            orgName={org?.name || ''}
            orgPhone={org?.phone || ''}
          />
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#6b7280] mt-8">
          Powered by White Glove Auto Service
        </p>
      </div>
    </div>
  );
}
