'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface Org {
  id: string;
  name: string;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

export function OrganizationForm({ org }: { org: Org }) {
  const [name, setName] = useState(org.name);
  const [phone, setPhone] = useState(org.phone ?? '');
  const [address, setAddress] = useState(org.address_line1 ?? '');
  const [city, setCity] = useState(org.city ?? '');
  const [state, setState] = useState(org.state ?? '');
  const [zip, setZip] = useState(org.zip ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    await supabase
      .from('organizations')
      .update({ name, phone: phone || null, address_line1: address || null, city: city || null, state: state || null, zip: zip || null, updated_at: new Date().toISOString() })
      .eq('id', org.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-base font-medium text-wg-text mb-4">Shop Profile</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-wg-muted mb-1">Business Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-wg-muted mb-1">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
          />
        </div>
        <div>
          <label className="block text-xs text-wg-muted mb-1">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-wg-muted mb-1">City</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-wg-muted mb-1">State</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
            />
          </div>
          <div>
            <label className="block text-xs text-wg-muted mb-1">ZIP</label>
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              className="w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-wg-blue text-white rounded-lg text-sm font-medium hover:bg-wg-blue/90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-wg-green">Saved</span>}
        </div>
      </div>
    </div>
  );
}
