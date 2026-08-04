import { AppShell } from '@/components/layout/AppShell';
import { Skeleton, StatCardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="p-8">
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-56 mb-6" />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        <div className="mt-8">
          <Skeleton className="h-5 w-36 mb-4" />
          <div className="rounded-xl border border-wg-border overflow-hidden">
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
            <TableRowSkeleton />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
