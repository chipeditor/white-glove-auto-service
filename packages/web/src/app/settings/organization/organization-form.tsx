'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase';

interface BusinessHours {
  [day: string]: { open: string; close: string; closed: boolean };
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const DEFAULT_HOURS: BusinessHours = Object.fromEntries(
  DAYS.map(d => [d, { open: '08:00', close: '17:00', closed: d === 'sunday' }])
);

const INPUT = 'w-full px-3 py-2 bg-wg-card border border-wg-border rounded-lg text-sm text-wg-text focus:outline-none focus:border-wg-blue';

interface Org {
  id: string;
  name: string;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  tax_rate: number | null;
  logo_url: string | null;
  settings: Record<string, unknown> | null;
}

export function OrganizationForm({ org }: { org: Org }) {
  const [name, setName] = useState(org.name);
  const [phone, setPhone] = useState(org.phone ?? '');
  const [address, setAddress] = useState(org.address_line1 ?? '');
  const [city, setCity] = useState(org.city ?? '');
  const [state, setState] = useState(org.state ?? '');
  const [zip, setZip] = useState(org.zip ?? '');
  const [taxRate, setTaxRate] = useState(((org.tax_rate ?? 0.0825) * 100).toFixed(2));
  const [logoUrl, setLogoUrl] = useState(org.logo_url ?? '');
  const [hours, setHours] = useState<BusinessHours>(
    (org.settings?.business_hours as BusinessHours) ?? DEFAULT_HOURS
  );
  const [googlePlaceId, setGooglePlaceId] = useState(
    (org.settings?.google_place_id as string) ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function updateHour(day: string, field: 'open' | 'close', value: string) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  }

  function toggleClosed(day: string) {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], closed: !prev[day].closed } }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const settings = {
      ...(org.settings ?? {}),
      business_hours: hours,
      google_place_id: googlePlaceId || null,
    };
    await supabase
      .from('organizations')
      .update({
        name,
        phone: phone || null,
        address_line1: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        tax_rate: parseFloat(taxRate) / 100,
        logo_url: logoUrl || null,
        settings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', org.id);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Shop Profile */}
      <section>
        <h2 className="text-base font-medium text-wg-text mb-4">Shop Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-wg-muted mb-1">Business Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-wg-muted mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-wg-muted mb-1">Logo URL</label>
            <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className={INPUT} />
          </div>
          {logoUrl && (
            <div className="flex items-center gap-3">
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-wg-bg2 border border-wg-border" />
              <span className="text-xs text-wg-muted">Preview</span>
            </div>
          )}
          <div>
            <label className="block text-xs text-wg-muted mb-1">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className={INPUT} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-wg-muted mb-1">City</label>
              <input value={city} onChange={(e) => setCity(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs text-wg-muted mb-1">State</label>
              <input value={state} onChange={(e) => setState(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label className="block text-xs text-wg-muted mb-1">ZIP</label>
              <input value={zip} onChange={(e) => setZip(e.target.value)} className={INPUT} />
            </div>
          </div>
        </div>
      </section>

      {/* Tax & Billing */}
      <section>
        <h2 className="text-base font-medium text-wg-text mb-4">Tax &amp; Billing</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-wg-muted mb-1">Default Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={INPUT}
            />
            <p className="text-[10px] text-wg-muted mt-1">Applied to new service requests</p>
          </div>
          <div>
            <label className="block text-xs text-wg-muted mb-1">Google Place ID</label>
            <input
              value={googlePlaceId}
              onChange={(e) => setGooglePlaceId(e.target.value)}
              placeholder="ChIJ..."
              className={INPUT}
            />
            <p className="text-[10px] text-wg-muted mt-1">For Google Reviews follow-up link</p>
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section>
        <h2 className="text-base font-medium text-wg-text mb-4">Business Hours</h2>
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-10 text-xs font-medium text-wg-text2">{DAY_LABELS[day]}</span>
              <button
                type="button"
                onClick={() => toggleClosed(day)}
                className={`w-16 text-xs px-2 py-1 rounded-md border transition-colors ${
                  hours[day]?.closed
                    ? 'bg-wg-bg2 border-wg-border text-wg-muted'
                    : 'bg-wg-green/10 border-wg-green/20 text-wg-green'
                }`}
              >
                {hours[day]?.closed ? 'Closed' : 'Open'}
              </button>
              {!hours[day]?.closed && (
                <>
                  <input
                    type="time"
                    value={hours[day]?.open ?? '08:00'}
                    onChange={(e) => updateHour(day, 'open', e.target.value)}
                    className="px-2 py-1 bg-wg-card border border-wg-border rounded-md text-xs text-wg-text focus:outline-none focus:border-wg-blue"
                  />
                  <span className="text-xs text-wg-muted">to</span>
                  <input
                    type="time"
                    value={hours[day]?.close ?? '17:00'}
                    onChange={(e) => updateHour(day, 'close', e.target.value)}
                    className="px-2 py-1 bg-wg-card border border-wg-border rounded-md text-xs text-wg-text focus:outline-none focus:border-wg-blue"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Save */}
      <div className="flex items-center gap-3">
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
  );
}
