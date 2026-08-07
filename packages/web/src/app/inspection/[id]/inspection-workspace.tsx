'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Flag, Loader2, CircleDot } from 'lucide-react';
import { DamageMarker } from '@/components/ui/DamageMarker';
import { FileUpload, type UploadedFile } from '@/components/ui/FileUpload';
import type { InspectionSection, InspectionItem } from '@/shared/types';
import type { DamageMarkerRow } from '@/lib/queries';

type SectionWithItems = InspectionSection & { items: InspectionItem[] };

interface DamagePoint {
  id: string;
  x: number;
  y: number;
  severity: 'minor' | 'moderate' | 'severe';
  note: string;
}

interface Props {
  inspectionId: string;
  vehicleId: string | null;
  organizationId: string;
  sections: SectionWithItems[];
  markers: DamageMarkerRow[];
  mediaAssets: UploadedFile[];
  status: string;
}

export function InspectionWorkspace({
  inspectionId,
  vehicleId,
  organizationId,
  sections,
  markers: initialMarkers,
  mediaAssets,
  status,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tabs come from the inspection's own sections, so the page reflects the
  // template it was actually created from rather than a fixed list.
  const tabs = ['Damage Map', 'Photos', ...sections.map((s) => s.name)];
  const [activeTab, setActiveTab] = useState(tabs[2] ?? 'Damage Map');

  const [items, setItems] = useState<Record<string, InspectionItem>>(() =>
    Object.fromEntries(sections.flatMap((s) => s.items).map((i) => [i.id, i]))
  );
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const [markers, setMarkers] = useState<DamagePoint[]>(() =>
    initialMarkers.map((m) => ({
      id: m.id,
      x: m.x_position ?? 0,
      y: m.y_position ?? 0,
      severity: m.severity,
      note: m.description ?? '',
    }))
  );
  const [markerState, setMarkerState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allItems = Object.values(items);
  const checkedCount = allItems.filter((i) => i.passed !== null).length;
  const failedCount = allItems.filter((i) => i.passed === false).length;
  const isComplete = allItems.length > 0 && checkedCount === allItems.length;

  async function patchItem(item: InspectionItem, patch: Partial<InspectionItem>) {
    const optimistic = { ...item, ...patch };
    setItems((prev) => ({ ...prev, [item.id]: optimistic }));
    setSavingIds((prev) => new Set(prev).add(item.id));
    setError(null);

    try {
      const res = await fetch(`/api/inspection-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        // Put the original back rather than leaving a lie on screen.
        setItems((prev) => ({ ...prev, [item.id]: item }));
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Could not save that change.');
      } else if (status === 'not_started') {
        await fetch(`/api/inspections/${inspectionId}/status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'in_progress' }),
        });
        startTransition(() => router.refresh());
      }
    } catch {
      setItems((prev) => ({ ...prev, [item.id]: item }));
      setError('Could not reach the server.');
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  }

  // Marker edits arrive on every drag; debounce so we persist the settled
  // state rather than every intermediate position.
  const handleMarkerChange = useCallback(
    (next: DamagePoint[]) => {
      setMarkers(next);
      setMarkerState('saving');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/inspections/${inspectionId}/damage`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markers: next }),
          });
          setMarkerState(res.ok ? 'saved' : 'idle');
          if (!res.ok) setError('Could not save damage markers.');
        } catch {
          setMarkerState('idle');
          setError('Could not save damage markers.');
        }
      }, 700);
    },
    [inspectionId]
  );

  async function completeInspection() {
    const res = await fetch(`/api/inspections/${inspectionId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: failedCount > 0 ? 'needs_attention' : 'completed' }),
    });
    if (res.ok) {
      startTransition(() => router.refresh());
    } else {
      setError('Could not complete the inspection.');
    }
  }

  const activeSection = sections.find((s) => s.name === activeTab);

  return (
    <div>
      {/* Progress */}
      <div className="mt-4 sm:mt-6 bg-wg-card rounded-xl border border-wg-border p-4">
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <span className="text-sm font-medium text-wg-text">
            {checkedCount} of {allItems.length} items checked
          </span>
          <div className="flex items-center gap-3">
            {failedCount > 0 && (
              <span className="text-xs text-wg-red font-medium">{failedCount} failed</span>
            )}
            {isComplete && status !== 'completed' && status !== 'signed_off' && (
              <button
                onClick={completeInspection}
                disabled={isPending}
                className="px-3 py-1.5 rounded-lg bg-wg-green/15 text-wg-green text-xs font-medium hover:bg-wg-green/25 transition-colors disabled:opacity-50"
              >
                Complete Inspection
              </button>
            )}
          </div>
        </div>
        <div className="w-full h-1.5 bg-wg-bg2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              failedCount > 0 ? 'bg-wg-amber' : 'bg-wg-green'
            }`}
            style={{ width: `${allItems.length ? (checkedCount / allItems.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mt-4 mb-4 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const section = sections.find((s) => s.name === tab);
          const done = section
            ? section.items.filter((i) => items[i.id]?.passed !== null).length
            : 0;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'bg-wg-blue/10 text-wg-blue'
                  : 'text-wg-text2 hover:bg-wg-card border border-wg-border'
              }`}
            >
              {tab}
              {section && (
                <span className="text-[10px] text-wg-muted">
                  {done}/{section.items.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeTab === 'Damage Map' ? (
        <div className="max-w-2xl">
          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-wg-text">Vehicle Damage Diagram</h3>
              <span className="text-xs text-wg-muted">
                {markerState === 'saving'
                  ? 'Saving…'
                  : markerState === 'saved'
                    ? 'Saved'
                    : `${markers.length} marked`}
              </span>
            </div>
            <DamageMarker vehicleType="sedan" markers={markers} onChange={handleMarkerChange} />
          </div>
        </div>
      ) : activeTab === 'Photos' ? (
        <div className="max-w-3xl">
          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <h3 className="text-sm font-medium text-wg-text mb-4">Inspection Photos</h3>
            {vehicleId ? (
              <FileUpload
                vehicleId={vehicleId}
                organizationId={organizationId}
                inspectionId={inspectionId}
                existingFiles={mediaAssets}
              />
            ) : (
              <p className="text-sm text-wg-muted">No vehicle linked to this inspection.</p>
            )}
          </div>
        </div>
      ) : activeSection ? (
        <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden max-w-3xl">
          {activeSection.items.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-wg-muted">
              No items in this section.
            </p>
          ) : (
            activeSection.items
              .slice()
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((raw) => {
                const item = items[raw.id] ?? raw;
                const saving = savingIds.has(item.id);
                return (
                  <ItemRow
                    key={item.id}
                    item={item}
                    saving={saving}
                    onPatch={(patch) => patchItem(item, patch)}
                  />
                );
              })
          )}
        </div>
      ) : null}
    </div>
  );
}

function ItemRow({
  item,
  saving,
  onPatch,
}: {
  item: InspectionItem;
  saving: boolean;
  onPatch: (patch: Partial<InspectionItem>) => void;
}) {
  const [noteDraft, setNoteDraft] = useState(item.notes ?? '');
  const [editingNote, setEditingNote] = useState(false);

  return (
    <div className="px-4 py-3 border-b border-wg-border last:border-b-0">
      <div className="flex items-start gap-3">
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onPatch({ passed: item.passed === true ? null : true })}
            title="Pass"
            aria-label={`Mark ${item.label} pass`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              item.passed === true
                ? 'bg-wg-green/20 text-wg-green'
                : 'bg-wg-bg2 text-wg-muted hover:text-wg-green'
            }`}
          >
            <Check size={15} />
          </button>
          <button
            onClick={() => onPatch({ passed: item.passed === false ? null : false })}
            title="Fail"
            aria-label={`Mark ${item.label} fail`}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              item.passed === false
                ? 'bg-wg-red/20 text-wg-red'
                : 'bg-wg-bg2 text-wg-muted hover:text-wg-red'
            }`}
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm ${item.flagged ? 'text-wg-red font-medium' : 'text-wg-text'}`}
            >
              {item.label}
            </span>
            {saving && <Loader2 size={12} className="animate-spin text-wg-muted" />}
            {item.passed === null && !saving && (
              <CircleDot size={11} className="text-wg-muted/50" />
            )}
          </div>

          {editingNote ? (
            <input
              autoFocus
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onBlur={() => {
                setEditingNote(false);
                if (noteDraft !== (item.notes ?? '')) onPatch({ notes: noteDraft });
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur();
                if (e.key === 'Escape') {
                  setNoteDraft(item.notes ?? '');
                  setEditingNote(false);
                }
              }}
              placeholder="Add a note…"
              className="mt-1 w-full bg-wg-input border border-wg-border rounded px-2 py-1 text-xs text-wg-text focus:outline-none focus:border-wg-blue/50"
            />
          ) : (
            <button
              onClick={() => setEditingNote(true)}
              className="mt-0.5 text-xs text-left text-wg-text2 hover:text-wg-text transition-colors"
            >
              {item.notes || <span className="text-wg-muted">Add a note…</span>}
            </button>
          )}
        </div>

        <button
          onClick={() => onPatch({ flagged: !item.flagged })}
          title={item.flagged ? 'Remove flag' : 'Flag for follow-up'}
          aria-label={`${item.flagged ? 'Remove flag from' : 'Flag'} ${item.label}`}
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            item.flagged
              ? 'bg-wg-amber/20 text-wg-amber'
              : 'bg-wg-bg2 text-wg-muted hover:text-wg-amber'
          }`}
        >
          <Flag size={14} />
        </button>
      </div>
    </div>
  );
}
