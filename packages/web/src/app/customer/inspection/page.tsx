import { CheckCircle, XCircle, Clock } from 'lucide-react';
import {
  fetchCustomerInspection,
  formatDateTime,
  vehicleName,
} from '@/lib/customer-queries';
import { SignedOutNotice, EmptyCard } from '../empty-states';
import { InspectionSections } from './sections-list';
import { ApprovalPanel } from './approval-panel';

export const dynamic = 'force-dynamic';

function money(n: number | null | undefined) {
  const value = Number(n ?? 0);
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default async function CustomerInspectionPage() {
  const view = await fetchCustomerInspection();

  if (!view) return <SignedOutNotice />;

  const { vehicle, inspection, inspectorName, sections, approval } = view;
  const items = sections.flatMap((s) => s.items);
  const failed = items.filter((i) => i.passed === false).length;
  const flagged = items.filter((i) => i.passed !== false && i.flagged).length;
  const passed = items.filter((i) => i.passed === true && !i.flagged).length;

  return (
    <div className="space-y-6">
      {inspection ? (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <div className="mb-4">
            <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">INSPECTION REPORT</p>
            <h2 className="text-lg font-semibold text-wg-text break-words">
              {vehicle ? vehicleName(vehicle) : 'Your vehicle'}
            </h2>
            <p className="text-xs text-wg-text2 mt-0.5">
              {inspection.type.replace(/_/g, ' ')} inspection
              {inspectorName ? ` · Inspected by ${inspectorName}` : ''}
              {formatDateTime(inspection.completed_at ?? inspection.started_at)
                ? ` · ${formatDateTime(inspection.completed_at ?? inspection.started_at)}`
                : ''}
            </p>
            {inspection.status !== 'completed' && inspection.status !== 'signed_off' && (
              <p className="text-xs text-wg-blue mt-2 flex items-center gap-1.5">
                <Clock size={12} /> This inspection is still in progress — results may change.
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="bg-emerald-400/5 rounded-xl p-3 text-center border border-emerald-400/10">
              <p className="text-xl font-bold text-emerald-400">{passed}</p>
              <p className="text-xs text-emerald-400/70 mt-0.5">Passed</p>
            </div>
            <div className="bg-amber-400/5 rounded-xl p-3 text-center border border-amber-400/10">
              <p className="text-xl font-bold text-amber-400">{flagged}</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Attention</p>
            </div>
            <div className="bg-red-400/5 rounded-xl p-3 text-center border border-red-400/10">
              <p className="text-xl font-bold text-red-400">{failed}</p>
              <p className="text-xs text-red-400/70 mt-0.5">Needs Repair</p>
            </div>
          </div>

          <p className="text-xs text-wg-text2 mt-3 text-center">
            {items.length} item{items.length === 1 ? '' : 's'} inspected across {sections.length} area
            {sections.length === 1 ? '' : 's'}
          </p>
        </div>
      ) : (
        <EmptyCard
          title="No inspection yet"
          body="Once our technicians complete an inspection on your vehicle, the full report and photos will appear here."
        />
      )}

      {/* Estimate approval — same approval_requests record as the emailed /approve link */}
      {approval && approval.respondable && (
        <ApprovalPanel token={approval.token} lines={approval.lines} />
      )}

      {approval && !approval.respondable && approval.lines.length > 0 && (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <h3 className="text-sm font-semibold text-wg-text mb-1">Estimate</h3>
          <p className="text-xs text-wg-text2 mb-4">
            {approval.expired && approval.status !== 'approved' && approval.status !== 'declined' && approval.status !== 'partially_approved'
              ? 'This estimate link has expired. Contact your advisor for an updated estimate.'
              : approval.responded_at
                ? `You responded on ${formatDateTime(approval.responded_at)}.`
                : 'This estimate is not open for a response right now.'}
          </p>

          <div className="space-y-2">
            {approval.lines.map((line) => {
              const isApproved = approval.approved_line_ids.includes(line.id);
              const isDeclined = approval.declined_line_ids.includes(line.id);
              return (
                <div
                  key={line.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-wg-border bg-wg-bg/30 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-wg-text break-words">{line.description}</p>
                    {(isApproved || isDeclined) && (
                      <span
                        className={`inline-flex items-center gap-1 text-xs mt-1 ${
                          isApproved ? 'text-emerald-400' : 'text-wg-muted'
                        }`}
                      >
                        {isApproved ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {isApproved ? 'Approved' : 'Declined'}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-sm font-semibold whitespace-nowrap ${
                      isDeclined ? 'text-wg-muted line-through' : 'text-wg-text'
                    }`}
                  >
                    {money(line.total)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sections.length > 0 && <InspectionSections sections={sections} />}
    </div>
  );
}
