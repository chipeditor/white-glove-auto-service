import { clsx } from 'clsx';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number;
  delta?: number;
  deltaLabel?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ label, value, delta, deltaLabel, icon: Icon, className }: StatCardProps) {
  return (
    <div className={clsx('bg-wg-card rounded-xl border border-wg-border p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-wg-text2">{label}</p>
          <p className="text-3xl font-semibold text-wg-text mt-1">{value}</p>
        </div>
        <div className="p-2 bg-wg-bg2 rounded-lg">
          <Icon size={20} className="text-wg-text2" />
        </div>
      </div>
      {delta !== undefined && (
        <div className="flex items-center gap-1.5 mt-3 text-xs">
          {delta > 0 ? (
            <>
              <TrendingUp size={12} className="text-wg-green" />
              <span className="text-wg-green">{delta} from yesterday</span>
            </>
          ) : (
            <>
              <Minus size={12} className="text-wg-muted" />
              <span className="text-wg-muted">{deltaLabel ?? '0 from yesterday'}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
