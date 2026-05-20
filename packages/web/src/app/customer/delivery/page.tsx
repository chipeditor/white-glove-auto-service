'use client';

import { useState } from 'react';
import { CalendarDays, Clock, MapPin, CheckCircle, Car, Sparkles } from 'lucide-react';

const TIME_SLOTS = [
  { id: '1', date: 'Tomorrow', day: 'Tue, May 20', slots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'] },
  { id: '2', date: 'Wednesday', day: 'Wed, May 21', slots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'] },
  { id: '3', date: 'Thursday', day: 'Thu, May 22', slots: ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM'] },
];

const DELIVERY_CHECKLIST = [
  { id: 'dc1', label: 'Final quality inspection', done: false },
  { id: 'dc2', label: 'Interior detail and cleaning', done: false },
  { id: 'dc3', label: 'Exterior wash and polish', done: false },
  { id: 'dc4', label: 'Service documentation prepared', done: false },
];

export default function CustomerDeliveryPage() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const vehicleReady = false;
  const selectedDayData = TIME_SLOTS.find((d) => d.id === selectedDay);

  if (confirmed) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-[#c8a45c]/10 to-[#c8a45c]/5 rounded-2xl border border-[#c8a45c]/20 p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-[#c8a45c]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-[#c8a45c]" />
          </div>
          <h2 className="text-lg font-semibold text-wg-text">Pickup Confirmed</h2>
          <p className="text-2xl font-bold text-[#c8a45c] mt-2">
            {selectedDayData?.day} at {selectedSlot}
          </p>
          <p className="text-sm text-wg-text2 mt-3 max-w-xs mx-auto">
            We&apos;ll have your Corvette Z51 freshly detailed and ready for you. See you then!
          </p>
        </div>

        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <h3 className="text-sm font-semibold text-wg-text mb-3">Pickup Location</h3>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-wg-blue/10 flex items-center justify-center shrink-0">
              <MapPin size={14} className="text-wg-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-wg-text">White Glove Auto Service</p>
              <p className="text-xs text-wg-text2 mt-0.5">1234 Performance Drive, Suite 100</p>
              <p className="text-xs text-wg-text2">Beverly Hills, CA 90210</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => { setConfirmed(false); setSelectedSlot(null); }}
          className="w-full text-center text-xs text-wg-text2 hover:text-wg-text py-2"
        >
          Need to reschedule?
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {!vehicleReady ? (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
              <Clock size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-wg-text">Vehicle Not Ready Yet</h2>
              <p className="text-xs text-wg-text2 mt-1 leading-relaxed">
                Your Corvette Z51 is still being serviced. You can schedule your pickup time now, and we&apos;ll confirm once the vehicle is ready. Estimated completion: <span className="text-[#c8a45c] font-medium">Tomorrow, 4:00 PM</span>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-wg-border">
            <p className="text-xs font-medium text-wg-text2 mb-3">Pre-Delivery Checklist</p>
            <div className="space-y-2">
              {DELIVERY_CHECKLIST.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                    item.done ? 'bg-emerald-400/10' : 'bg-wg-bg border border-wg-border'
                  }`}>
                    {item.done && <CheckCircle size={10} className="text-emerald-400" />}
                  </div>
                  <span className={`text-xs ${item.done ? 'text-wg-text' : 'text-wg-muted'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-emerald-400/10 to-emerald-400/5 rounded-2xl border border-emerald-400/20 p-5">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-emerald-400" />
            <div>
              <h2 className="text-sm font-semibold text-wg-text">Your Vehicle is Ready!</h2>
              <p className="text-xs text-wg-text2 mt-0.5">Schedule a time below to pick up your Corvette Z51.</p>
            </div>
          </div>
        </div>
      )}

      {/* Day selector */}
      <div>
        <h3 className="text-sm font-semibold text-wg-text mb-3 flex items-center gap-2">
          <CalendarDays size={15} className="text-[#c8a45c]" />
          Schedule Pickup
        </h3>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {TIME_SLOTS.map((day) => (
            <button
              key={day.id}
              onClick={() => { setSelectedDay(day.id); setSelectedSlot(null); }}
              className={`rounded-xl border p-3 text-center transition-colors ${
                selectedDay === day.id
                  ? 'border-[#c8a45c] bg-[#c8a45c]/10'
                  : 'border-wg-border bg-wg-card hover:bg-wg-card-hover'
              }`}
            >
              <p className={`text-xs font-medium ${selectedDay === day.id ? 'text-[#c8a45c]' : 'text-wg-text'}`}>
                {day.date}
              </p>
              <p className="text-[11px] text-wg-text2 mt-0.5">{day.day}</p>
            </button>
          ))}
        </div>

        {/* Time slots */}
        {selectedDayData && (
          <div>
            <p className="text-xs text-wg-text2 mb-2">Available times for {selectedDayData.day}:</p>
            <div className="grid grid-cols-4 gap-2">
              {selectedDayData.slots.map((slot) => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`rounded-lg border px-2 py-2 text-xs font-medium transition-colors ${
                    selectedSlot === slot
                      ? 'border-[#c8a45c] bg-[#c8a45c]/10 text-[#c8a45c]'
                      : 'border-wg-border bg-wg-card text-wg-text2 hover:bg-wg-card-hover hover:text-wg-text'
                  }`}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Confirm */}
      {selectedSlot && (
        <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#c8a45c]/10 flex items-center justify-center">
              <Car size={18} className="text-[#c8a45c]" />
            </div>
            <div>
              <p className="text-sm font-medium text-wg-text">
                {selectedDayData?.day} at {selectedSlot}
              </p>
              <p className="text-xs text-wg-text2">White Glove Auto Service, Beverly Hills</p>
            </div>
          </div>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full px-4 py-2.5 rounded-lg bg-[#c8a45c] text-[#1a1a2e] text-sm font-semibold hover:bg-[#b8944c] transition-colors"
          >
            Confirm Pickup Time
          </button>
        </div>
      )}

      {/* Location */}
      <div className="bg-wg-card rounded-2xl border border-wg-border p-5">
        <h3 className="text-sm font-semibold text-wg-text mb-3">Pickup Location</h3>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-wg-blue/10 flex items-center justify-center shrink-0">
            <MapPin size={14} className="text-wg-blue" />
          </div>
          <div>
            <p className="text-sm font-medium text-wg-text">White Glove Auto Service</p>
            <p className="text-xs text-wg-text2 mt-0.5">1234 Performance Drive, Suite 100</p>
            <p className="text-xs text-wg-text2">Beverly Hills, CA 90210</p>
            <p className="text-xs text-wg-muted mt-1">Mon–Fri 8AM–6PM &middot; Sat 9AM–3PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
