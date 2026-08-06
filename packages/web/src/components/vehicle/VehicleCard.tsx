'use client';

import Link from 'next/link';
import { Car, MoreVertical } from 'lucide-react';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { VehicleWithCustomer } from '@/shared/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface VehicleCardProps {
  vehicle: VehicleWithCustomer;
}

export function VehicleRow({ vehicle }: VehicleCardProps) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-wg-card-hover transition-colors border-b border-wg-border last:border-b-0"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-wg-bg2 flex items-center justify-center">
          <Car size={16} className="text-wg-text2" />
        </div>
        <div>
          <span className="text-sm font-medium text-wg-text">
            {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
          </span>
          <p className="text-xs text-wg-muted">VIN: {vehicle.vin}</p>
        </div>
      </div>
      <span className="text-sm text-wg-text2">{vehicle.customer?.full_name ?? '—'}</span>
      <StatusBadge status={vehicle.status} />
      <span className="text-xs text-wg-muted w-16 text-right">{timeAgo(vehicle.updated_at)}</span>
      <button
        onClick={(e) => e.preventDefault()}
        className="p-1 text-wg-muted hover:text-wg-text transition-colors"
      >
        <MoreVertical size={16} />
      </button>
    </Link>
  );
}

function VehicleMobileCard({ vehicle }: VehicleCardProps) {
  return (
    <Link
      href={`/vehicles/${vehicle.id}`}
      className="block bg-wg-card rounded-xl border border-wg-border p-3.5 active:bg-wg-card-hover transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-wg-bg2 flex items-center justify-center shrink-0">
            <Car size={14} className="text-wg-text2" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-wg-text truncate">
              {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
            </p>
            {vehicle.vin && (
              <p className="text-[11px] text-wg-muted truncate">VIN: {vehicle.vin}</p>
            )}
          </div>
        </div>
        <StatusBadge status={vehicle.status} />
      </div>
      <div className="flex items-center gap-3 text-xs text-wg-muted mt-1">
        {vehicle.customer?.full_name && (
          <span className="truncate">{vehicle.customer.full_name}</span>
        )}
        <span className="ml-auto shrink-0">{timeAgo(vehicle.updated_at)}</span>
      </div>
    </Link>
  );
}

export function VehicleTable({ vehicles }: { vehicles: VehicleWithCustomer[] }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-wg-border">
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Vehicle</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Customer</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">Status</span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider w-16 text-right">Updated</span>
          <span className="w-6" />
        </div>
        {vehicles.map((v) => (
          <VehicleRow key={v.id} vehicle={v} />
        ))}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {vehicles.map((v) => (
          <VehicleMobileCard key={v.id} vehicle={v} />
        ))}
      </div>
    </>
  );
}
