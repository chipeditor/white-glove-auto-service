'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import type { RepairOrderLine } from '@/shared/types';

function money(n: number | null | undefined) {
  const value = Number(n ?? 0);
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Approve / decline the estimate lines attached to the customer's service
 * request. Submits to `/api/approvals/respond` — the same endpoint the emailed
 * `/approve/[token]` page posts to — so both routes share one approval record,
 * one declined-job trail and one advisor notification.
 */
export function ApprovalPanel({
  token,
  lines,
}: {
  token: string;
  lines: RepairOrderLine[];
}) {
  const router = useRouter();
  const [decisions, setDecisions] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decided = Object.keys(decisions).length;
  const approvedCount = Object.values(decisions).filter(Boolean).length;
  const approvedTotal = lines
    .filter((l) => decisions[l.id])
    .reduce((sum, l) => sum + Number(l.total ?? 0), 0);
  const allDecided = decided === lines.length;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/approvals/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          approvedLineIds: lines.filter((l) => decisions[l.id]).map((l) => l.id),
          declinedLineIds: lines.filter((l) => decisions[l.id] === false).map((l) => l.id),
          comments: comments.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'We could not record your response. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-wg-card rounded-2xl border border-[#c8a45c]/20 p-5">
      <h3 className="text-sm font-semibold text-wg-text mb-1">Your Approval Needed</h3>
      <p className="text-xs text-wg-text2 mb-4">
        We prepared {lines.length} line item{lines.length === 1 ? '' : 's'} for your vehicle. Approve
        or decline each one, then confirm.
      </p>

      <div className="space-y-3">
        {lines.map((line) => {
          const decision = decisions[line.id];
          const hasDecision = line.id in decisions;

          return (
            <div
              key={line.id}
              className={`rounded-xl border p-4 ${
                hasDecision
                  ? decision
                    ? 'border-emerald-400/20 bg-emerald-400/5'
                    : 'border-wg-border bg-wg-bg/50'
                  : 'border-wg-border bg-wg-bg/30'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.5 rounded bg-wg-card text-wg-text2 border border-wg-border uppercase">
                      {line.line_type}
                    </span>
                    <span className="text-sm font-medium text-wg-text break-words">
                      {line.description}
                    </span>
                  </div>
                  {line.notes && <p className="text-xs text-wg-text2 mt-1">{line.notes}</p>}
                </div>
                <span className="text-sm font-semibold text-wg-text whitespace-nowrap">
                  {money(line.total)}
                </span>
              </div>

              {hasDecision ? (
                <div className="mt-3 flex items-center gap-2">
                  {decision ? (
                    <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                      <CheckCircle size={13} /> Approved
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-wg-muted flex items-center gap-1">
                      <XCircle size={13} /> Declined
                    </span>
                  )}
                  <button
                    onClick={() =>
                      setDecisions((prev) => {
                        const next = { ...prev };
                        delete next[line.id];
                        return next;
                      })
                    }
                    className="text-xs text-wg-text2 hover:text-wg-text ml-auto"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setDecisions((prev) => ({ ...prev, [line.id]: true }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-xs font-semibold hover:bg-[#b8944c] transition-colors"
                  >
                    <ThumbsUp size={12} /> Approve
                  </button>
                  <button
                    onClick={() => setDecisions((prev) => ({ ...prev, [line.id]: false }))}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-wg-bg text-wg-text2 text-xs font-medium hover:bg-wg-card border border-wg-border transition-colors"
                  >
                    <ThumbsDown size={12} /> Decline
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-wg-border space-y-3">
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          placeholder="Anything you'd like us to know? (optional)"
          className="w-full rounded-lg bg-wg-input border border-wg-border px-3 py-2 text-xs text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-[#c8a45c]/50"
        />

        {error && (
          <p className="text-xs text-wg-red bg-wg-red/10 border border-wg-red/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-wg-text2">
            {approvedCount} of {lines.length} approved
            {approvedCount > 0 && <> &middot; {money(approvedTotal)}</>}
          </p>
          <button
            onClick={submit}
            disabled={!allDecided || submitting}
            className="px-4 py-2.5 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-xs font-semibold hover:bg-[#b8944c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={13} className="animate-spin" />}
            Confirm Selections
          </button>
        </div>
        {!allDecided && (
          <p className="text-[11px] text-wg-muted text-right">
            Choose approve or decline on every item to continue.
          </p>
        )}
      </div>
    </div>
  );
}
