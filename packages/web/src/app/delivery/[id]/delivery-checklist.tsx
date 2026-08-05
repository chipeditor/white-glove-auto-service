'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Check, Circle, Truck, CheckCircle2, Star } from 'lucide-react';

interface ChecklistItem {
  id: string;
  label: string;
  sort_order: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
}

interface Props {
  serviceRequestId: string;
  organizationId: string;
  vehicleId: string;
  checklist: { id: string; total_items: number; completed_items: number } | null;
  items: ChecklistItem[];
  defaultItems: string[];
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerId?: string;
}

export function DeliveryChecklist({ serviceRequestId, organizationId, vehicleId, checklist: initialChecklist, items: initialItems, defaultItems, customerName, customerEmail, customerPhone, customerId }: Props) {
  const router = useRouter();
  const [checklist, setChecklist] = useState(initialChecklist);
  const [items, setItems] = useState(initialItems);
  const [creating, setCreating] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);
  const [sendingReview, setSendingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function createChecklist() {
    setCreating(true);
    const supabase = createClient();

    const { data: cl } = await supabase
      .from('checklists')
      .insert({
        organization_id: organizationId,
        vehicle_id: vehicleId,
        service_request_id: serviceRequestId,
        title: 'Delivery Checklist',
        description: 'Pre-delivery inspection and handoff checklist',
        total_items: defaultItems.length,
        completed_items: 0,
      })
      .select()
      .single();

    if (cl) {
      const itemRows = defaultItems.map((label, i) => ({
        checklist_id: cl.id,
        label,
        sort_order: i,
        completed: false,
      }));
      const { data: newItems } = await supabase
        .from('checklist_items')
        .insert(itemRows)
        .select();

      setChecklist(cl);
      setItems(newItems ?? []);
    }
    setCreating(false);
  }

  async function toggleItem(item: ChecklistItem) {
    if (!checklist) return;
    const supabase = createClient();
    const newCompleted = !item.completed;

    await supabase
      .from('checklist_items')
      .update({
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', item.id);

    const updatedItems = items.map(i => i.id === item.id ? { ...i, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null } : i);
    setItems(updatedItems);

    const completedCount = updatedItems.filter(i => i.completed).length;
    await supabase
      .from('checklists')
      .update({ completed_items: completedCount, updated_at: new Date().toISOString() })
      .eq('id', checklist.id);

    setChecklist({ ...checklist, completed_items: completedCount });
  }

  async function markDelivered() {
    setCompleting(true);
    const supabase = createClient();
    await supabase
      .from('service_requests')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', serviceRequestId);

    if (customerEmail) {
      fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template: 'vehicle_delivered',
          to: customerEmail,
          vehicleId,
          organizationId,
        }),
      }).catch(() => {});
    }

    setCompleting(false);
    router.push(`/service-requests/${serviceRequestId}`);
  }

  async function sendReviewRequest() {
    if (!customerPhone) return;
    setSendingReview(true);
    setReviewError(null);
    try {
      const res = await fetch('/api/reviews/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId || null,
          customerName: customerName || null,
          customerPhone,
          organizationId,
          serviceRequestId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewError(data.error || 'Failed to send review request');
      } else {
        setReviewSent(true);
      }
    } catch {
      setReviewError('Network error');
    }
    setSendingReview(false);
  }

  if (!checklist) {
    return (
      <div className="bg-wg-card rounded-xl border border-wg-border p-8 text-center">
        <Truck size={32} className="mx-auto text-wg-muted mb-3" />
        <h3 className="text-sm font-medium text-wg-text mb-1">Start Delivery Process</h3>
        <p className="text-xs text-wg-muted mb-4">Create the delivery checklist to begin the handoff process.</p>
        <button
          onClick={createChecklist}
          disabled={creating}
          className="px-4 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90 disabled:opacity-50"
        >
          {creating ? 'Creating...' : 'Create Delivery Checklist'}
        </button>
      </div>
    );
  }

  const allDone = items.length > 0 && items.every(i => i.completed);
  const progress = items.length > 0 ? Math.round((checklist.completed_items / items.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="bg-wg-card rounded-xl border border-wg-border p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-wg-text">Delivery Progress</h3>
          <span className="text-xs text-wg-muted">{checklist.completed_items}/{items.length} completed</span>
        </div>
        <div className="w-full h-2 bg-wg-bg2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${allDone ? 'bg-wg-green' : 'bg-wg-blue'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        {items.map((item, i) => (
          <button
            key={item.id}
            onClick={() => toggleItem(item)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-wg-bg2/50 ${
              i < items.length - 1 ? 'border-b border-wg-border' : ''
            }`}
          >
            {item.completed ? (
              <CheckCircle2 size={20} className="text-wg-green flex-shrink-0" />
            ) : (
              <Circle size={20} className="text-wg-border flex-shrink-0" />
            )}
            <span className={`text-sm ${item.completed ? 'text-wg-muted line-through' : 'text-wg-text'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {allDone && (
        <div className="space-y-3">
          <button
            onClick={markDelivered}
            disabled={completing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-wg-green text-white rounded-xl text-sm font-medium hover:bg-wg-green/90 disabled:opacity-50"
          >
            <Check size={16} />
            {completing ? 'Completing...' : 'Mark Vehicle as Delivered'}
          </button>

          {customerPhone && (
            <div className="bg-wg-card rounded-xl border border-wg-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={16} className="text-wg-gold" />
                <h4 className="text-sm font-medium text-wg-text">Google Review Follow-Up</h4>
              </div>
              <p className="text-xs text-wg-muted mb-3">
                Send {customerName || 'the customer'} an SMS with a link to leave a Google review.
              </p>
              {reviewSent ? (
                <div className="flex items-center gap-2 text-sm text-wg-green">
                  <CheckCircle2 size={14} />
                  Review request sent to {customerPhone}
                </div>
              ) : (
                <>
                  {reviewError && (
                    <p className="text-xs text-red-400 mb-2">{reviewError}</p>
                  )}
                  <button
                    onClick={sendReviewRequest}
                    disabled={sendingReview}
                    className="flex items-center gap-2 px-4 py-2 bg-wg-gold/10 text-wg-gold border border-wg-gold/30 rounded-lg text-sm font-medium hover:bg-wg-gold/20 disabled:opacity-50"
                  >
                    <Star size={14} />
                    {sendingReview ? 'Sending...' : 'Send Review Request'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
