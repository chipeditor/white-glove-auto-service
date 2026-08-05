'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Car } from 'lucide-react';

const SERVICE_TYPES = [
  'Performance Inspection',
  'Routine Service',
  'Brake Service',
  'Oil Change',
  'Pre-Purchase Inspection',
  'Cosmetic Repair',
  'Diagnostics',
  'Other',
];

const INPUT = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#c8a45c]/50 placeholder-white/30';

function formatTime(time: string): string {
  const [h, m] = time.split(':');
  const hour = parseInt(h);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function getNextWeekdays(count: number): string[] {
  const dates: string[] = [];
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (dates.length < count) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${dd}`);
    }
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDateLabel(dateStr: string): { day: string; date: string; month: string } {
  const d = new Date(dateStr + 'T12:00:00');
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.getDate().toString(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

const ORG_ID = 'a0000000-0000-0000-0000-000000000001';

export default function BookingPage() {
  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const dates = getNextWeekdays(10);

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime('');
    fetch(`/api/appointments?orgId=${ORG_ID}&date=${selectedDate}`)
      .then(r => r.json())
      .then(data => setAvailableSlots(data.slots ?? []))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate]);

  async function handleSubmit() {
    if (!name.trim() || !serviceType || !selectedDate || !selectedTime) return;
    setSubmitting(true);
    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orgId: ORG_ID,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        serviceType,
        description,
        date: selectedDate,
        time: selectedTime,
      }),
    });
    if (res.ok) {
      setConfirmed(true);
    }
    setSubmitting(false);
  }

  if (confirmed) {
    const dateLabel = formatDateLabel(selectedDate);
    return (
      <div className="min-h-screen bg-[#0d0d14] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white mb-2">Appointment Confirmed</h1>
          <p className="text-white/50 text-sm mb-6">
            {dateLabel.day}, {dateLabel.month} {dateLabel.date} at {formatTime(selectedTime)}
          </p>
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-left mb-6">
            <p className="text-sm text-white font-medium">{serviceType}</p>
            <p className="text-xs text-white/40 mt-1">{name}</p>
            {description && <p className="text-xs text-white/40 mt-1">{description}</p>}
          </div>
          <p className="text-xs text-white/30">
            We&apos;ll send a confirmation to {email || phone || 'you'} shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d14]">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-[#c8a45c]/20 flex items-center justify-center mx-auto mb-3">
            <Car size={24} className="text-[#c8a45c]" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Book a Service</h1>
          <p className="text-sm text-white/40 mt-1">KSB Performance &middot; 871 N Liberty St, Elgin, IL</p>
        </div>

        <div className="flex items-center gap-2 mb-8 justify-center">
          {['Service', 'Date & Time', 'Your Info'].map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                i <= step ? 'bg-[#c8a45c] text-black' : 'bg-white/10 text-white/30'
              }`}>
                {i + 1}
              </div>
              <span className={`text-xs ${i <= step ? 'text-white/70' : 'text-white/20'}`}>{label}</span>
              {i < 2 && <div className={`w-6 h-px ${i < step ? 'bg-[#c8a45c]/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Select a Service</p>
            {SERVICE_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setServiceType(type); setStep(1); }}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                  serviceType === type
                    ? 'bg-[#c8a45c]/10 border-[#c8a45c]/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-sm font-medium">{type}</span>
              </button>
            ))}
            <div className="pt-2">
              <label className="text-xs text-white/40 mb-1 block">Additional details (optional)</label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Any specific concerns or requests..."
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar size={12} />
                Pick a Date
              </p>
              <div className="grid grid-cols-5 gap-2">
                {dates.map(d => {
                  const label = formatDateLabel(d);
                  const active = d === selectedDate;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDate(d)}
                      className={`flex flex-col items-center py-2.5 rounded-xl border transition-colors ${
                        active
                          ? 'bg-[#c8a45c]/10 border-[#c8a45c]/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-[10px] text-white/40">{label.day}</span>
                      <span className={`text-lg font-semibold ${active ? 'text-[#c8a45c]' : 'text-white/70'}`}>{label.date}</span>
                      <span className="text-[10px] text-white/40">{label.month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Clock size={12} />
                  Pick a Time
                </p>
                {loadingSlots ? (
                  <p className="text-sm text-white/30 text-center py-4">Loading available times...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-white/30 text-center py-4">No available times for this date.</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {availableSlots.map(slot => {
                      const active = slot === selectedTime;
                      return (
                        <button
                          key={slot}
                          onClick={() => setSelectedTime(slot)}
                          className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                            active
                              ? 'bg-[#c8a45c]/10 border-[#c8a45c]/30 text-[#c8a45c]'
                              : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          {formatTime(slot)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(0)} className="px-4 py-2.5 text-sm text-white/40 hover:text-white">Back</button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedDate || !selectedTime}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-black bg-[#c8a45c] rounded-xl hover:bg-[#c8a45c]/90 disabled:opacity-30"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Your Information</p>
            <div>
              <label className="text-xs text-white/40 mb-1 block">Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 mb-1 block">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" className={INPUT} />
              </div>
              <div>
                <label className="text-xs text-white/40 mb-1 block">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" className={INPUT} />
              </div>
            </div>

            <div className="bg-white/5 rounded-xl border border-white/10 p-4 mt-4">
              <p className="text-xs text-white/40 mb-2">Appointment Summary</p>
              <p className="text-sm text-white font-medium">{serviceType}</p>
              <p className="text-xs text-white/50 mt-1">
                {formatDateLabel(selectedDate).day}, {formatDateLabel(selectedDate).month} {formatDateLabel(selectedDate).date} at {formatTime(selectedTime)}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2.5 text-sm text-white/40 hover:text-white">Back</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !name.trim()}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-black bg-[#c8a45c] rounded-xl hover:bg-[#c8a45c]/90 disabled:opacity-30"
              >
                {submitting ? 'Booking...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
