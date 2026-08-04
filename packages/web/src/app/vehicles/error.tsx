'use client';

import { AppShell } from '@/components/layout/AppShell';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function VehiclesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle size={48} className="text-wg-alert mb-4" />
        <h2 className="text-lg font-medium text-wg-text mb-2">Failed to load vehicles</h2>
        <p className="text-sm text-wg-text2 mb-6 text-center max-w-md">
          {error.message || 'An unexpected error occurred.'}
        </p>
        <Button onClick={reset}>
          <RefreshCw size={16} />
          Try Again
        </Button>
      </div>
    </AppShell>
  );
}
