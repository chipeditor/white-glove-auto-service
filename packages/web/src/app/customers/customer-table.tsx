'use client';

import { useState, useMemo } from 'react';
import { Search, Mail, Phone, MapPin, ChevronDown, ChevronUp, X } from 'lucide-react';
import type { Customer } from '@/shared/types';

interface Props {
  customers: Customer[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  return phone;
}

export function CustomerTable({ customers }: Props) {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')))
    );
  }, [customers, search]);

  return (
    <div>
      {/* Search bar */}
      <div className="relative mb-4">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-wg-muted"
        />
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-9 pr-8 py-2 rounded-lg bg-wg-card border border-wg-border text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50 focus:ring-1 focus:ring-wg-blue/25 transition-colors"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-wg-muted hover:text-wg-text transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results count */}
      {search && (
        <p className="text-xs text-wg-muted mb-3">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'} found
        </p>
      )}

      {/* Table */}
      <div className="bg-wg-card rounded-xl border border-wg-border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-4 py-3 border-b border-wg-border">
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Name
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider">
            Email
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider min-w-[130px]">
            Phone
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider min-w-[140px]">
            Location
          </span>
          <span className="text-xs font-medium text-wg-muted uppercase tracking-wider w-8" />
        </div>

        {filtered.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-wg-muted">
            {search ? 'No customers match your search.' : 'No customers found.'}
          </div>
        ) : (
          filtered.map((customer) => {
            const isExpanded = expandedId === customer.id;
            const location = [customer.city, customer.state]
              .filter(Boolean)
              .join(', ');

            return (
              <div key={customer.id} className="border-b border-wg-border last:border-b-0">
                {/* Main row */}
                <button
                  onClick={() =>
                    setExpandedId(isExpanded ? null : customer.id)
                  }
                  className="w-full grid grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4 px-4 py-3 hover:bg-wg-card-hover transition-colors text-left"
                >
                  <span className="text-sm font-medium text-wg-text">
                    {customer.full_name}
                  </span>
                  <span className="text-sm text-wg-text2 truncate">
                    {customer.email ?? '—'}
                  </span>
                  <span className="text-sm text-wg-text2 min-w-[130px]">
                    {customer.phone ? formatPhone(customer.phone) : '—'}
                  </span>
                  <span className="text-sm text-wg-text2 min-w-[140px]">
                    {location || '—'}
                  </span>
                  <span className="w-8 flex justify-center text-wg-muted">
                    {isExpanded ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </span>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-wg-bg2/50 border-t border-wg-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-3">
                      {/* Contact info */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-wg-muted uppercase tracking-wider">
                          Contact
                        </h4>
                        {customer.email && (
                          <div className="flex items-center gap-2 text-sm text-wg-text2">
                            <Mail size={14} className="text-wg-muted" />
                            <a
                              href={`mailto:${customer.email}`}
                              className="hover:text-wg-blue transition-colors"
                            >
                              {customer.email}
                            </a>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center gap-2 text-sm text-wg-text2">
                            <Phone size={14} className="text-wg-muted" />
                            <a
                              href={`tel:${customer.phone}`}
                              className="hover:text-wg-blue transition-colors"
                            >
                              {formatPhone(customer.phone)}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Address */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-wg-muted uppercase tracking-wider">
                          Address
                        </h4>
                        <div className="flex items-start gap-2 text-sm text-wg-text2">
                          <MapPin size={14} className="text-wg-muted mt-0.5 shrink-0" />
                          <div>
                            {customer.address_line1 && <p>{customer.address_line1}</p>}
                            {(customer.city || customer.state || customer.zip) && (
                              <p>
                                {[customer.city, customer.state].filter(Boolean).join(', ')}
                                {customer.zip ? ` ${customer.zip}` : ''}
                              </p>
                            )}
                            {!customer.address_line1 &&
                              !customer.city &&
                              !customer.state && <p className="text-wg-muted">No address on file</p>}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-wg-muted uppercase tracking-wider">
                          Notes
                        </h4>
                        <p className="text-sm text-wg-text2">
                          {customer.notes || 'No notes'}
                        </p>
                      </div>
                    </div>

                    {/* Footer with created date */}
                    <div className="pt-2 border-t border-wg-border">
                      <span className="text-xs text-wg-muted">
                        Customer since {formatDate(customer.created_at)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
