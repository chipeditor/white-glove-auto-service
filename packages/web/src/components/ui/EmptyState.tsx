import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon = Inbox, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-wg-card rounded-2xl mb-4">
        <Icon size={32} className="text-wg-muted" />
      </div>
      <h3 className="text-lg font-medium text-wg-text">{title}</h3>
      {description && <p className="mt-1 text-sm text-wg-text2 text-center max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
