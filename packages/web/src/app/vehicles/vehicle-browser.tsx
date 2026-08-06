'use client';

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { VehicleTable } from '@/components/vehicle/VehicleCard';
import type { VehicleWithCustomer, VehicleStatus } from '@/shared/types';

const STATUS_FILTERS: { label: string; value: VehicleStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'In Service', value: 'in_service' },
  { label: 'Ready for Delivery', value: 'ready_for_delivery' },
  { label: 'Awaiting Approval', value: 'awaiting_approval' },
  { label: 'Delivered', value: 'delivered' },
];

interface Props {
  vehicles: VehicleWithCustomer[];
}

export function VehicleBrowser({ vehicles }: Props) {
  const [filter, setFilter] = useState<VehicleStatus | 'all'>('all');
  const [search, setSearch] = useState('');

  const statusCounts = useMemo(
    () =>
      vehicles.reduce<Record<string, number>>((acc, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {}),
    [vehicles]
  );

  const filtered = useMemo(() => {
    let list = filter === 'all' ? vehicles : vehicles.filter((v) => v.status === filter);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((v) => {
        const name = `${v.year ?? ''} ${v.make} ${v.model} ${v.trim ?? ''}`.toLowerCase();
        return (
          name.includes(q) ||
          (v.vin ?? '').toLowerCase().includes(q) ||
          (v.license_plate ?? '').toLowerCase().includes(q) ||
          (v.customer?.full_name ?? '').toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [vehicles, filter, search]);

  return (
    <div>
      <div className="relative w-full sm:max-w-md mt-4 sm:mt-6 mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wg-muted" />
        <input
          type="text"
          placeholder="Search by vehicle, VIN, plate, or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-wg-input border border-wg-border rounded-lg pl-9 pr-8 py-2 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-wg-muted hover:text-wg-text"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => {
          const count = f.value === 'all' ? vehicles.length : statusCounts[f.value] || 0;
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                active ? 'bg-wg-blue/10 text-wg-blue' : 'text-wg-text2 hover:bg-wg-card'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span className={`text-[10px] ${active ? 'text-wg-blue/70' : 'text-wg-muted'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-wg-card rounded-xl border border-wg-border px-4 py-12 text-center text-sm text-wg-muted">
          No vehicles match.
        </div>
      ) : (
        <VehicleTable vehicles={filtered} />
      )}
    </div>
  );
}
