'use client';

import { useState } from 'react';
import { Check, X, MessageSquare } from 'lucide-react';

interface Line {
  id: string;
  line_type: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Props {
  token: string;
  lines: Line[];
  subtotal: number;
  taxRate: number;
  orgName: string;
  orgPhone: string;
}

const TYPE_LABELS: Record<string, string> = {
  labor: 'Labor',
  parts: 'Parts',
  sublet: 'Sublet',
  fee: 'Fee',
  discount: 'Discount',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function ApprovalForm({ token, lines, subtotal, taxRate, orgName, orgPhone }: Props) {
  const [selections, setSelections] = useState<Record<string, 'approved' | 'declined'>>(() => {
    const init: Record<string, 'approved' | 'declined'> = {};
    lines.forEach(l => { init[l.id] = 'approved'; });
    return init;
  });
  const [comments, setComments] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultStatus, setResultStatus] = useState('');

  function toggleLine(id: string) {
    setSelections(prev => ({
      ...prev,
      [id]: prev[id] === 'approved' ? 'declined' : 'approved',
    }));
  }

  function approveAll() {
    const all: Record<string, 'approved' | 'declined'> = {};
    lines.forEach(l => { all[l.id] = 'approved'; });
    setSelections(all);
  }

  const approvedLines = lines.filter(l => selections[l.id] === 'approved');
  const declinedLines = lines.filter(l => selections[l.id] === 'declined');
  const approvedTotal = approvedLines.reduce((sum, l) => sum + l.total, 0);
  const taxAmount = approvedTotal * taxRate;

  async function submit() {
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/approvals/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          approvedLineIds: approvedLines.map(l => l.id),
          declinedLineIds: declinedLines.map(l => l.id),
          comments: comments || null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResultStatus(data.status);
        setSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
          <Check size={32} className="text-green-400" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Response Submitted</h2>
        <p className="text-sm text-[#9ca3af]">
          {resultStatus === 'approved' && 'You approved all items. Work will begin shortly.'}
          {resultStatus === 'declined' && 'You declined all items. The shop will follow up with you.'}
          {resultStatus === 'partially_approved' && `You approved ${approvedLines.length} of ${lines.length} items.`}
        </p>
        {approvedLines.length > 0 && (
          <p className="text-sm text-white mt-3 font-medium">
            Approved total: {formatCurrency(approvedTotal + taxAmount)}
          </p>
        )}
        <p className="text-xs text-[#6b7280] mt-4">
          Questions? Contact {orgName}{orgPhone ? ` at ${orgPhone}` : ''}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Line Items */}
      <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#2a2a3e] flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Recommended Services</h2>
          <button
            onClick={approveAll}
            className="text-xs text-[#c8a45c] hover:text-[#d4b06a] transition-colors"
          >
            Approve All
          </button>
        </div>

        <div className="divide-y divide-[#2a2a3e]">
          {lines.map(line => {
            const isApproved = selections[line.id] === 'approved';
            return (
              <button
                key={line.id}
                onClick={() => toggleLine(line.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[#222240] transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                    isApproved
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isApproved ? <Check size={16} /> : <X size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isApproved ? 'text-white' : 'text-[#6b7280] line-through'}`}>
                    {line.description}
                  </p>
                  <p className="text-xs text-[#9ca3af] mt-0.5">
                    {TYPE_LABELS[line.line_type] || line.line_type} &middot; {line.quantity} &times; {formatCurrency(line.unit_price)}
                  </p>
                </div>
                <span className={`text-sm font-medium flex-shrink-0 ${isApproved ? 'text-white' : 'text-[#6b7280] line-through'}`}>
                  {formatCurrency(line.total)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Totals */}
        <div className="px-5 py-4 border-t border-[#2a2a3e] bg-[#151525] space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-[#9ca3af]">Subtotal ({approvedLines.length} items)</span>
            <span className="text-sm text-white">{formatCurrency(approvedTotal)}</span>
          </div>
          {taxRate > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-[#9ca3af]">Tax ({(taxRate * 100).toFixed(2)}%)</span>
              <span className="text-sm text-white">{formatCurrency(taxAmount)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-[#2a2a3e]">
            <span className="text-sm font-medium text-white">Total</span>
            <span className="text-lg font-bold text-[#c8a45c]">{formatCurrency(approvedTotal + taxAmount)}</span>
          </div>
        </div>
      </div>

      {/* Comments */}
      {showComments ? (
        <div className="bg-[#1a1a2e] rounded-xl border border-[#2a2a3e] p-4">
          <label className="text-xs text-[#9ca3af] block mb-2">Comments (optional)</label>
          <textarea
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={3}
            placeholder="Any questions or notes for the service team..."
            className="w-full px-3 py-2 text-sm bg-[#0d0d14] rounded-lg border border-[#2a2a3e] text-white placeholder-[#6b7280] resize-none focus:outline-none focus:border-[#c8a45c]"
          />
        </div>
      ) : (
        <button
          onClick={() => setShowComments(true)}
          className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
        >
          <MessageSquare size={14} />
          Add a comment
        </button>
      )}

      {/* Submit */}
      <button
        onClick={submit}
        disabled={isSubmitting}
        className="w-full py-3 text-sm font-medium text-white bg-[#c8a45c] rounded-xl hover:bg-[#d4b06a] disabled:opacity-40 transition-colors"
      >
        {isSubmitting
          ? 'Submitting...'
          : declinedLines.length === 0
            ? 'Approve Estimate'
            : `Approve ${approvedLines.length} of ${lines.length} Items`}
      </button>

      {declinedLines.length > 0 && declinedLines.length < lines.length && (
        <p className="text-center text-xs text-[#9ca3af]">
          {declinedLines.length} item{declinedLines.length > 1 ? 's' : ''} will be declined
        </p>
      )}

      {declinedLines.length === lines.length && (
        <button
          onClick={submit}
          disabled={isSubmitting}
          className="w-full py-3 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 disabled:opacity-40 transition-colors"
        >
          Decline All Items
        </button>
      )}
    </div>
  );
}
