'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Car, Loader2 } from 'lucide-react';

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function formatDayLabel(iso: string) {
  const date = parseIsoDate(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatDayShort(iso: string) {
  return parseIsoDate(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/** "14:30:00" -> "2:30 PM" */
export function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`;
}

/**
 * Pickup scheduling. Free slots come from the existing public booking endpoint
 * (`GET /api/appointments?orgId&date`); the booking itself goes to
 * `POST /api/customer/appointments`, which resolves the customer from the
 * session and writes a real `appointments` row linked to them.
 */
export function DeliveryScheduler({
  orgId,
  candidateDates,
  locationName,
}: {
  orgId: string;
  candidateDates: string[];
  locationName: string;
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guards against a slower earlier request overwriting a newer day's slots.
  const requestSeq = useRef(0);

  async function selectDay(date: string) {
    const seq = ++requestSeq.current;
    setSelectedDate(date);
    setSelectedTime(null);
    setSlots(null);
    setError(null);
    setLoadingSlots(true);

    try {
      const res = await fetch(
        `/api/appointments?orgId=${encodeURIComponent(orgId)}&date=${encodeURIComponent(date)}`
      );
      const body = await res.json();
      if (seq !== requestSeq.current) return;
      setSlots(Array.isArray(body?.slots) ? body.slots : []);
    } catch {
      if (seq === requestSeq.current) {
        setError('We could not load available times. Please try again.');
      }
    } finally {
      if (seq === requestSeq.current) setLoadingSlots(false);
    }
  }

  async function confirm() {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/customer/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate, time: selectedTime }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body?.error ?? 'We could not book that time. Please try another slot.');
        return;
      }
      router.refresh();
    } catch {
      setError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-wg-text mb-3 flex items-center gap-2">
        <CalendarDays size={15} className="text-[#c8a45c]" />
        Schedule Pickup
      </h3>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {candidateDates.map((date) => (
          <button
            key={date}
            onClick={() => selectDay(date)}
            className={`rounded-xl border p-3 text-center transition-colors ${
              selectedDate === date
                ? 'border-[#c8a45c] bg-[#c8a45c]/10'
                : 'border-wg-border bg-wg-card hover:bg-wg-card-hover'
            }`}
          >
            <p
              className={`text-xs font-medium ${
                selectedDate === date ? 'text-[#c8a45c]' : 'text-wg-text'
              }`}
            >
              {formatDayLabel(date)}
            </p>
            <p className="text-[11px] text-wg-text2 mt-0.5">{formatDayShort(date)}</p>
          </button>
        ))}
      </div>

      {selectedDate && (
        <div>
          <p className="text-xs text-wg-text2 mb-2">
            Available times for {formatDayShort(selectedDate)}:
          </p>
          {loadingSlots ? (
            <p className="text-xs text-wg-muted flex items-center gap-1.5">
              <Loader2 size={12} className="animate-spin" /> Checking availability…
            </p>
          ) : slots && slots.length === 0 ? (
            <p className="text-xs text-wg-text2">
              No open times left on this day. Please pick another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(slots ?? []).map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedTime(slot)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    selectedTime === slot
                      ? 'border-[#c8a45c] bg-[#c8a45c]/10 text-[#c8a45c]'
                      : 'border-wg-border bg-wg-card text-wg-text2 hover:bg-wg-card-hover hover:text-wg-text'
                  }`}
                >
                  {formatTime(slot)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-wg-red bg-wg-red/10 border border-wg-red/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {selectedDate && selectedTime && (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5 mt-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#c8a45c]/10 flex items-center justify-center shrink-0">
              <Car size={18} className="text-[#c8a45c]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-wg-text">
                {formatDayShort(selectedDate)} at {formatTime(selectedTime)}
              </p>
              <p className="text-xs text-wg-text2 truncate">{locationName}</p>
            </div>
          </div>
          <button
            onClick={confirm}
            disabled={submitting}
            className="w-full px-4 py-2.5 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-sm font-semibold hover:bg-[#b8944c] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Confirm Pickup Time
          </button>
        </div>
      )}
    </div>
  );
}
