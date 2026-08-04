'use client';

import { useState } from 'react';
import { Wrench, Package, ArrowRight, Tag, Minus, Plus, Trash2, Send, MessageSquare, Check } from 'lucide-react';
import type { RepairOrderLine, ServiceRequestWithDetails, LineItemType } from '@/shared/types';

const TYPE_ICONS: Record<string, typeof Wrench> = {
  labor: Wrench,
  parts: Package,
  sublet: ArrowRight,
  fee: Tag,
  discount: Minus,
};

const TYPE_LABELS: Record<string, string> = {
  labor: 'Labor',
  parts: 'Parts',
  sublet: 'Sublet',
  fee: 'Fee',
  discount: 'Discount',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-gray-500/15 text-gray-400',
  approved: 'bg-green-500/15 text-green-400',
  declined: 'bg-red-500/15 text-red-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

interface NewLine {
  line_type: LineItemType;
  description: string;
  quantity: number;
  unit_price: number;
}

interface Props {
  lines: RepairOrderLine[];
  sr: ServiceRequestWithDetails;
}

export function ServiceRequestLineItems({ lines: initialLines, sr }: Props) {
  const [lines, setLines] = useState(initialLines);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLine, setNewLine] = useState<NewLine>({ line_type: 'labor', description: '', quantity: 1, unit_price: 0 });
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isSendingApproval, setIsSendingApproval] = useState(false);
  const [approvalUrl, setApprovalUrl] = useState<string | null>(null);
  const [showSmsDialog, setShowSmsDialog] = useState(false);
  const [smsPhone, setSmsPhone] = useState(sr.customer?.phone || '');
  const [smsSending, setSmsSending] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);

  const subtotal = lines.filter(l => l.status !== 'declined').reduce((sum, l) => sum + l.total, 0);

  async function addLine() {
    if (!newLine.description || newLine.unit_price <= 0) return;
    setIsAdding(true);
    try {
      const res = await fetch(`/api/service-requests/${sr.id}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_request_id: sr.id,
          organization_id: sr.organization_id,
          ...newLine,
        }),
      });
      if (res.ok) {
        const { line } = await res.json();
        setLines(prev => [...prev, line]);
        setNewLine({ line_type: 'labor', description: '', quantity: 1, unit_price: 0 });
        setShowAddForm(false);
      }
    } finally {
      setIsAdding(false);
    }
  }

  async function deleteLine(lineId: string) {
    setDeletingId(lineId);
    try {
      const res = await fetch(`/api/service-requests/${sr.id}/lines?lineId=${lineId}`, { method: 'DELETE' });
      if (res.ok) {
        setLines(prev => prev.filter(l => l.id !== lineId));
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function sendForApproval() {
    setIsSendingApproval(true);
    try {
      const res = await fetch('/api/approvals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceRequestId: sr.id,
          organizationId: sr.organization_id,
          customerId: sr.customer_id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setApprovalUrl(data.approvalUrl);
        setShowSmsDialog(true);
      }
    } finally {
      setIsSendingApproval(false);
    }
  }

  async function sendSms() {
    if (!smsPhone || !approvalUrl) return;
    setSmsSending(true);
    try {
      const customerName = sr.customer?.full_name?.split(' ')[0] || 'there';
      const vehicleName = sr.vehicle ? `${sr.vehicle.year || ''} ${sr.vehicle.make} ${sr.vehicle.model}`.trim() : 'your vehicle';
      const body = `Hi ${customerName}, your estimate for the ${vehicleName} is ready for review: ${approvalUrl}`;

      const res = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: smsPhone,
          body,
          customerId: sr.customer_id,
          serviceRequestId: sr.id,
          organizationId: sr.organization_id,
        }),
      });
      if (res.ok) {
        setSmsSuccess(true);
        setTimeout(() => setShowSmsDialog(false), 2000);
      }
    } finally {
      setSmsSending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        <div className="px-4 py-3 border-b border-wg-border flex items-center justify-between">
          <h3 className="text-sm font-medium text-wg-text">Estimate / Line Items</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-wg-muted">{lines.length} items</span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-wg-blue bg-wg-blue/10 rounded-md hover:bg-wg-blue/20 transition-colors"
            >
              <Plus size={12} />
              Add
            </button>
          </div>
        </div>

        {/* Add Line Form */}
        {showAddForm && (
          <div className="px-4 py-3 border-b border-wg-border bg-wg-bg2/50">
            <div className="grid grid-cols-[100px_1fr_80px_100px] gap-2 items-end">
              <div>
                <label className="text-[10px] text-wg-muted uppercase tracking-wider">Type</label>
                <select
                  value={newLine.line_type}
                  onChange={e => setNewLine(p => ({ ...p, line_type: e.target.value as LineItemType }))}
                  className="w-full mt-1 px-2 py-1.5 text-xs bg-wg-bg rounded-md border border-wg-border text-wg-text"
                >
                  {Object.entries(TYPE_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-wg-muted uppercase tracking-wider">Description</label>
                <input
                  value={newLine.description}
                  onChange={e => setNewLine(p => ({ ...p, description: e.target.value }))}
                  placeholder="Service description..."
                  className="w-full mt-1 px-2 py-1.5 text-xs bg-wg-bg rounded-md border border-wg-border text-wg-text placeholder-wg-muted"
                />
              </div>
              <div>
                <label className="text-[10px] text-wg-muted uppercase tracking-wider">Qty</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={newLine.quantity}
                  onChange={e => setNewLine(p => ({ ...p, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full mt-1 px-2 py-1.5 text-xs bg-wg-bg rounded-md border border-wg-border text-wg-text"
                />
              </div>
              <div>
                <label className="text-[10px] text-wg-muted uppercase tracking-wider">Unit Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newLine.unit_price || ''}
                  onChange={e => setNewLine(p => ({ ...p, unit_price: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                  className="w-full mt-1 px-2 py-1.5 text-xs bg-wg-bg rounded-md border border-wg-border text-wg-text"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-wg-text2 hover:text-wg-text transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addLine}
                disabled={isAdding || !newLine.description || newLine.unit_price <= 0}
                className="px-3 py-1.5 text-xs font-medium text-white bg-wg-blue rounded-md hover:bg-wg-blue/80 disabled:opacity-40 transition-colors"
              >
                {isAdding ? 'Adding...' : 'Add Line'}
              </button>
            </div>
          </div>
        )}

        {/* Line Items */}
        {lines.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Wrench size={24} className="mx-auto text-wg-muted mb-2" />
            <p className="text-sm text-wg-muted">No line items yet.</p>
            <p className="text-xs text-wg-muted mt-1">Click &ldquo;Add&rdquo; to build the estimate.</p>
          </div>
        ) : (
          <div className="divide-y divide-wg-border">
            {lines.map((line) => {
              const Icon = TYPE_ICONS[line.line_type] ?? Wrench;
              return (
                <div key={line.id} className="px-4 py-3 flex items-center gap-3 group">
                  <div className="w-7 h-7 rounded-md bg-wg-bg2 flex items-center justify-center flex-shrink-0">
                    <Icon size={14} className="text-wg-text2" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-wg-text truncate">{line.description}</span>
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          STATUS_STYLES[line.status] ?? 'bg-gray-500/15 text-gray-400'
                        }`}
                      >
                        {line.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-wg-muted">{TYPE_LABELS[line.line_type]}</span>
                      <span className="text-xs text-wg-muted">
                        {line.quantity} × {formatCurrency(line.unit_price)}
                      </span>
                      {line.discount_amount > 0 && (
                        <span className="text-xs text-green-400">
                          -{formatCurrency(line.discount_amount)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-wg-text flex-shrink-0">
                    {formatCurrency(line.total)}
                  </span>
                  <button
                    onClick={() => deleteLine(line.id)}
                    disabled={deletingId === line.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-wg-muted hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Subtotal bar */}
        {lines.length > 0 && (
          <div className="px-4 py-3 border-t border-wg-border flex items-center justify-between bg-wg-bg2/30">
            <span className="text-sm font-medium text-wg-text">Subtotal</span>
            <span className="text-sm font-bold text-wg-text">{formatCurrency(subtotal)}</span>
          </div>
        )}
      </div>

      {/* Send for Approval */}
      {lines.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={sendForApproval}
            disabled={isSendingApproval}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-wg-blue rounded-xl hover:bg-wg-blue/80 disabled:opacity-40 transition-colors"
          >
            <Send size={14} />
            {isSendingApproval ? 'Creating approval link...' : 'Send for Customer Approval'}
          </button>
        </div>
      )}

      {/* SMS Dialog */}
      {showSmsDialog && approvalUrl && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-wg-card border border-wg-border rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium text-wg-text mb-1">Send Approval Link</h3>
            <p className="text-xs text-wg-muted mb-4">Text the estimate to the customer for approval.</p>

            <div className="mb-3">
              <label className="text-xs text-wg-muted">Approval URL</label>
              <div className="mt-1 px-3 py-2 text-xs text-wg-text2 bg-wg-bg rounded-md border border-wg-border break-all">
                {approvalUrl}
              </div>
            </div>

            <div className="mb-4">
              <label className="text-xs text-wg-muted">Customer Phone</label>
              <input
                value={smsPhone}
                onChange={e => setSmsPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full mt-1 px-3 py-2 text-sm bg-wg-bg rounded-md border border-wg-border text-wg-text placeholder-wg-muted"
              />
            </div>

            {smsSuccess ? (
              <div className="flex items-center gap-2 text-green-400 text-sm mb-3">
                <Check size={16} />
                SMS sent successfully!
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSmsDialog(false)}
                  className="flex-1 px-3 py-2 text-sm text-wg-text2 hover:text-wg-text transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(approvalUrl);
                  }}
                  className="px-3 py-2 text-sm text-wg-text2 border border-wg-border rounded-md hover:bg-wg-bg2 transition-colors"
                >
                  Copy Link
                </button>
                <button
                  onClick={sendSms}
                  disabled={smsSending || !smsPhone}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-wg-blue rounded-md hover:bg-wg-blue/80 disabled:opacity-40 transition-colors"
                >
                  <MessageSquare size={14} />
                  {smsSending ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
