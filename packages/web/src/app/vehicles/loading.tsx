import { AppShell } from '@/components/layout/AppShell';
import { Skeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

export default function VehiclesLoading() {
  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-6" />

        <div className="flex gap-2 mt-6 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-lg" />
          ))}
        </div>

        <div className="rounded-xl border border-wg-border overflow-hidden">
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
          <TableRowSkeleton />
        </div>
      </div>
    </AppShell>
  );
}
