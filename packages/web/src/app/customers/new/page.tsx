'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';

const INPUT =
  'w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50';
const LABEL = 'block text-xs font-medium text-wg-muted mb-1.5';

export default function NewCustomerPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [notes, setNotes] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim() || saving) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          email,
          phone,
          address_line1: addressLine1,
          city,
          state,
          zip,
          notes,
        }),
      });

      if (res.ok) {
        router.push('/customers');
        router.refresh();
      } else {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? 'Could not create customer.');
      }
    } catch {
      setError('Could not reach the server.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-2xl">
        <PageHeader
          title="Add Customer"
          breadcrumbs={[{ label: 'Customers', href: '/customers' }, { label: 'Add Customer' }]}
        />

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="bg-wg-card rounded-xl border border-wg-border p-5 space-y-4">
            <div>
              <label className={LABEL} htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                className={INPUT}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Doe"
                required
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL} htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  className={INPUT}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className={LABEL} htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  className={INPUT}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
          </div>

          <div className="bg-wg-card rounded-xl border border-wg-border p-5 space-y-4">
            <div>
              <label className={LABEL} htmlFor="address">Street address</label>
              <input
                id="address"
                className={INPUT}
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                placeholder="123 Main St"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className={LABEL} htmlFor="city">City</label>
                <input id="city" className={INPUT} value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="state">State</label>
                <input id="state" className={INPUT} value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div>
                <label className={LABEL} htmlFor="zip">ZIP</label>
                <input id="zip" className={INPUT} value={zip} onChange={(e) => setZip(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="bg-wg-card rounded-xl border border-wg-border p-5">
            <label className={LABEL} htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              className={`${INPUT} min-h-[80px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Preferences, vehicle history, anything worth remembering."
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!fullName.trim() || saving}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
            <Link href="/customers">
              <Button variant="ghost" type="button">Cancel</Button>
            </Link>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
