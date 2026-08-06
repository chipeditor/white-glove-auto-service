'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/shared/types';

interface TechAssignmentProps {
  serviceRequestId: string;
  currentTechnicianId: string | null;
  technicians: User[];
}

export function TechAssignment({
  serviceRequestId,
  currentTechnicianId,
  technicians,
}: TechAssignmentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState(currentTechnicianId ?? '');

  async function handleChange(techId: string) {
    setSelectedId(techId);
    const res = await fetch(`/api/service-requests/${serviceRequestId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ technician_id: techId || null }),
    });

    if (res.ok) {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-wg-muted">Technician</span>
      <div className="relative">
        <select
          value={selectedId}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isPending}
          className="appearance-none bg-wg-bg2 border border-wg-border rounded-md px-2 py-1 pr-6 text-sm text-wg-text focus:outline-none focus:ring-1 focus:ring-wg-blue disabled:opacity-50 cursor-pointer"
        >
          <option value="">Unassigned</option>
          {technicians.map((tech) => (
            <option key={tech.id} value={tech.id}>
              {tech.full_name}
            </option>
          ))}
        </select>
        {isPending && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-wg-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
