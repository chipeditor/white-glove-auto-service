'use client';

import { Check, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import type { ChecklistItem } from '@white-glove/shared/types';

interface ChecklistItemRowProps {
  item: ChecklistItem;
  onToggle?: (id: string) => void;
}

export function ChecklistItemRow({ item, onToggle }: ChecklistItemRowProps) {
  return (
    <button
      onClick={() => onToggle?.(item.id)}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-wg-card-hover transition-colors border-b border-wg-border last:border-b-0"
    >
      <div
        className={clsx(
          'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
          item.completed
            ? 'bg-wg-green text-white'
            : 'border border-wg-border-light'
        )}
      >
        {item.completed && <Check size={12} />}
      </div>
      <span className={clsx('text-sm', item.completed ? 'text-wg-text2 line-through' : 'text-wg-text')}>
        {item.label}
      </span>
    </button>
  );
}

interface ChecklistProgressProps {
  completed: number;
  total: number;
  className?: string;
}

export function ChecklistProgress({ completed, total, className }: ChecklistProgressProps) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className={clsx('space-y-2', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-wg-text2">Overall Progress</span>
        <span className="text-wg-muted">{completed} of {total}</span>
      </div>
      <div className="h-2 bg-wg-bg2 rounded-full overflow-hidden">
        <div
          className="h-full bg-wg-blue rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-right text-xs text-wg-muted">{pct}%</div>
    </div>
  );
}
