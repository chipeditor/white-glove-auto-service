import { AppShell } from '@/components/layout/AppShell';
import { Skeleton } from '@/components/ui/Skeleton';

export default function VehicleDetailLoading() {
  return (
    <AppShell>
      <div className="p-4 sm:p-8">
        <Skeleton className="h-4 w-48 mb-4" />
        <div className="flex gap-6 mt-4">
          <div className="flex-1 space-y-4">
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40" />
            <div className="flex gap-2 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-lg" />
              ))}
            </div>
            <Skeleton className="h-64 w-full rounded-xl mt-4" />
          </div>
          <div className="w-80 space-y-4">
            <Skeleton className="h-40 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
