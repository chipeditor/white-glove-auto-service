import { EmptyState } from '@/components/ui/EmptyState';
import { Shield } from 'lucide-react';

export default function AuditLogPage() {
  return (
    <EmptyState
      icon={Shield}
      title="Coming Soon"
      description="Audit log tracking is under development."
    />
  );
}
