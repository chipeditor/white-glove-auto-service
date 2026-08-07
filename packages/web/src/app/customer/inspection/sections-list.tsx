'use client';

import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, HelpCircle, ChevronDown, ChevronUp, Camera } from 'lucide-react';
import type { CustomerInspectionSection } from '@/lib/customer-queries';

type ItemState = 'pass' | 'flag' | 'fail' | 'unchecked';

const STATUS_CONFIG: Record<ItemState, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  pass: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Good' },
  flag: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Attention' },
  fail: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Needs Repair' },
  unchecked: { icon: HelpCircle, color: 'text-wg-muted', bg: 'bg-wg-bg', label: 'Not checked' },
};

export function itemState(item: { passed: boolean | null; flagged: boolean }): ItemState {
  if (item.passed === false) return 'fail';
  if (item.flagged) return 'flag';
  if (item.passed === true) return 'pass';
  return 'unchecked';
}

export function InspectionSections({ sections }: { sections: CustomerInspectionSection[] }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sections.map((s) => [s.id, s.items.some((i) => itemState(i) !== 'pass' && itemState(i) !== 'unchecked')])
    )
  );

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-wg-text">Detailed Results</h3>
      {sections.map((section) => {
        const isExpanded = expanded[section.id];
        const sectionFlags = section.items.filter((i) => {
          const s = itemState(i);
          return s === 'flag' || s === 'fail';
        }).length;

        return (
          <div key={section.id} className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [section.id]: !prev[section.id] }))}
              className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-wg-card-hover transition-colors text-left"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-medium text-wg-text truncate">{section.name}</span>
                {sectionFlags > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-400/10 text-amber-400 shrink-0">
                    {sectionFlags} flagged
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-wg-muted shrink-0">
                <span className="text-xs">{section.items.length} items</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-wg-border">
                {section.items.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-wg-text2">
                    No items were recorded for this area.
                  </p>
                ) : (
                  section.items.map((item) => {
                    const config = STATUS_CONFIG[itemState(item)];
                    const Icon = config.icon;

                    return (
                      <div
                        key={item.id}
                        className="px-4 py-2.5 flex items-start gap-3 border-b border-wg-border/50 last:border-0"
                      >
                        <div
                          className={`w-6 h-6 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}
                        >
                          <Icon size={12} className={config.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-sm text-wg-text break-words">{item.label}</span>
                            <span className={`text-xs shrink-0 ${config.color}`}>{config.label}</span>
                          </div>
                          {item.value && (
                            <p className="text-xs text-wg-text2 mt-0.5">Measured: {item.value}</p>
                          )}
                          {item.notes && <p className="text-xs text-wg-text2 mt-0.5">{item.notes}</p>}
                          {item.photoCount > 0 && (
                            <span className="inline-flex items-center gap-1 text-xs text-wg-muted mt-1">
                              <Camera size={11} /> {item.photoCount} photo
                              {item.photoCount > 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
