import { clsx } from 'clsx';
import { Check, Circle, AlertTriangle } from 'lucide-react';
import type { InspectionItem } from '@/shared/types';

interface InspectionItemRowProps {
  item: InspectionItem;
}

export function InspectionItemRow({ item }: InspectionItemRowProps) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-wg-border last:border-b-0">
      <div className="mt-0.5">
        {item.passed === true && (
          <div className="w-5 h-5 rounded-full bg-wg-green/20 flex items-center justify-center">
            <Check size={12} className="text-wg-green" />
          </div>
        )}
        {item.passed === false && (
          <div className="w-5 h-5 rounded-full bg-wg-red/20 flex items-center justify-center">
            <AlertTriangle size={12} className="text-wg-red" />
          </div>
        )}
        {item.passed === null && (
          <div className="w-5 h-5 rounded-full border border-wg-border-light" />
        )}
      </div>
      <div className="flex-1">
        <span className={clsx('text-sm', item.flagged ? 'text-wg-red' : 'text-wg-text')}>
          {item.label}
        </span>
        {item.notes && <p className="text-xs text-wg-text2 mt-0.5">{item.notes}</p>}
      </div>
    </div>
  );
}

interface InspectionSectionProps {
  name: string;
  items: InspectionItem[];
  completedCount: number;
  totalCount: number;
}

export function InspectionSectionCard({ name, items, completedCount, totalCount }: InspectionSectionProps) {
  return (
    <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-wg-border">
        <h3 className="text-sm font-medium text-wg-text">{name}</h3>
        <span className="text-xs text-wg-muted">
          {completedCount} / {totalCount}
        </span>
      </div>
      {items.map((item) => (
        <InspectionItemRow key={item.id} item={item} />
      ))}
    </div>
  );
}
