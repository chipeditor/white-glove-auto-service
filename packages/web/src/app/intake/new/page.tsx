'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { ProgressStepper } from '@/components/ui/ProgressStepper';
import { Button } from '@/components/ui/Button';
import { X, MoreVertical, ScanLine, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';

const STEPS = [
  { label: 'Vehicle', key: 'vehicle' },
  { label: 'Customer', key: 'customer' },
  { label: 'Service', key: 'service' },
  { label: 'Inspection', key: 'inspection' },
];

const INPUT = 'w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text focus:outline-none focus:border-wg-blue/50';

export default function NewIntakePage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [vin, setVin] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [plate, setPlate] = useState('');
  const [plateState, setPlateState] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [existingCustomers, setExistingCustomers] = useState<{ id: string; full_name: string; email: string | null; phone: string | null }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  const [serviceType, setServiceType] = useState('Performance Inspection');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (step === 1 && existingCustomers.length === 0) {
      setLoadingCustomers(true);
      fetch('/api/customers')
        .then((r) => r.ok ? r.json() : [])
        .then((data) => setExistingCustomers(data))
        .catch(() => {})
        .finally(() => setLoadingCustomers(false));
    }
  }, [step, existingCustomers.length]);

  const customerMatches = useMemo(() => {
    if (!customerSearch.trim()) return [];
    const q = customerSearch.toLowerCase();
    return existingCustomers.filter(
      (c) => c.full_name.toLowerCase().includes(q) || (c.phone?.includes(q) ?? false) || (c.email?.toLowerCase().includes(q) ?? false)
    ).slice(0, 5);
  }, [customerSearch, existingCustomers]);

  function selectCustomer(c: { id: string; full_name: string; email: string | null; phone: string | null }) {
    setSelectedCustomerId(c.id);
    setCustomerName(c.full_name);
    setCustomerEmail(c.email ?? '');
    setCustomerPhone(c.phone ?? '');
    setCustomerSearch('');
  }

  const [scanning, setScanning] = useState(false);
  const [decoding, setDecoding] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  const stopScanner = useCallback(() => {
    setScanning(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    cancelAnimationFrame(animFrameRef.current);
  }, []);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  async function decodeVIN(vinValue: string) {
    if (vinValue.length !== 17) return;
    setDecoding(true);
    try {
      const res = await fetch(`/api/vin-decode?vin=${encodeURIComponent(vinValue)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.year) setYear(data.year);
      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.trim) setTrim(data.trim);
    } catch {
      // ignore decode errors
    } finally {
      setDecoding(false);
    }
  }

  function handleVinChange(value: string) {
    const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 17);
    setVin(cleaned);
    if (cleaned.length === 17) {
      decodeVIN(cleaned);
    }
  }

  async function startScanner() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      setScanning(true);

      await new Promise<void>((resolve) => {
        const check = () => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });

      if (!('BarcodeDetector' in window)) {
        await scanWithCanvas(stream);
        return;
      }

      const detector = new (window as unknown as { BarcodeDetector: new (opts: { formats: string[] }) => { detect: (src: HTMLVideoElement) => Promise<{ rawValue: string }[]> } }).BarcodeDetector({
        formats: ['code_39', 'code_128', 'data_matrix', 'pdf417', 'qr_code'],
      });

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const barcodes = await detector.detect(videoRef.current);
          for (const barcode of barcodes) {
            const cleaned = barcode.rawValue.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (cleaned.length === 17) {
              setVin(cleaned);
              stopScanner();
              decodeVIN(cleaned);
              return;
            }
          }
        } catch {
          // detection error, continue scanning
        }
        animFrameRef.current = requestAnimationFrame(scan);
      };
      animFrameRef.current = requestAnimationFrame(scan);
    } catch {
      alert('Camera access denied. Please allow camera access to scan VIN barcodes.');
    }
  }

  async function scanWithCanvas(stream: MediaStream) {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scan = () => {
      if (!streamRef.current || !video.videoWidth) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      animFrameRef.current = requestAnimationFrame(scan);
    };
    animFrameRef.current = requestAnimationFrame(scan);
  }

  async function handleSubmit() {
    if (!make.trim() || !model.trim()) {
      setSubmitError('Vehicle make and model are required.');
      setStep(0);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin, year, make, model, trim, color, mileage, plate, plateState,
          customerName, customerEmail, customerPhone,
          customerId: selectedCustomerId,
          serviceType, description,
          inspectionType: 'intake',
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setSubmitError(data.error || 'Failed to create intake');
        setSubmitting(false);
        return;
      }
      const { serviceRequestId } = await res.json();
      router.push(`/service-requests/${serviceRequestId}`);
    } catch {
      setSubmitError('Something went wrong');
      setSubmitting(false);
    }
  }

  const stepData = STEPS.map((s, i) => ({
    ...s,
    completed: i < step,
    active: i === step,
  }));

  return (
    <AppShell>
      <div className="p-4 sm:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="p-2 text-wg-muted hover:text-wg-text transition-colors">
              <X size={20} />
            </Link>
            <h1 className="text-lg font-semibold text-wg-text">New Intake</h1>
          </div>
          <button className="p-2 text-wg-muted hover:text-wg-text transition-colors">
            <MoreVertical size={20} />
          </button>
        </div>

        <ProgressStepper steps={stepData} className="mb-8" />

        {step === 0 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Vehicle Information</h2>

            {scanning ? (
              <div className="relative rounded-lg overflow-hidden bg-black">
                <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-4/5 h-20 border-2 border-[#c8a45c] rounded-lg" />
                </div>
                <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">
                  Point camera at VIN barcode
                </p>
                <button
                  onClick={stopScanner}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 text-white text-sm rounded-lg hover:bg-black/80"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={startScanner}
                className="flex items-center gap-2 px-4 py-3 w-full bg-wg-bg2 border border-wg-border rounded-lg text-sm text-wg-gold hover:border-wg-gold/30 transition-colors"
              >
                <Camera size={18} />
                Scan VIN Barcode
              </button>
            )}

            {decoding && (
              <div className="flex items-center gap-2 text-sm text-wg-text2">
                <Loader2 size={14} className="animate-spin" />
                Decoding VIN...
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">VIN</label>
              <input
                value={vin}
                onChange={(e) => handleVinChange(e.target.value)}
                placeholder="17-character VIN"
                className={INPUT}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Year</label>
                <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="e.g. 2024" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Make</label>
                <input value={make} onChange={(e) => setMake(e.target.value)} placeholder="e.g. Mercedes-Benz" className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Model</label>
                <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="e.g. S 580" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Trim</label>
                <input value={trim} onChange={(e) => setTrim(e.target.value)} placeholder="e.g. AMG" className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Color</label>
                <input value={color} onChange={(e) => setColor(e.target.value)} placeholder="e.g. Obsidian Black" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Mileage</label>
                <input value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="e.g. 5,312" className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">License Plate</label>
                <input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="e.g. ABC1234" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">State</label>
                <input value={plateState} onChange={(e) => setPlateState(e.target.value)} placeholder="e.g. CA" className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Customer Information</h2>

            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Find Existing Customer</label>
              <input
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomerId(null); }}
                placeholder="Search by name, phone, or email..."
                className={INPUT}
              />
              {loadingCustomers && <p className="text-xs text-wg-muted mt-1">Loading customers...</p>}
              {customerMatches.length > 0 && (
                <div className="mt-2 bg-wg-bg2 rounded-lg border border-wg-border divide-y divide-wg-border/50">
                  {customerMatches.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCustomer(c)}
                      className="w-full text-left px-3 py-2.5 hover:bg-wg-card transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span className="text-sm text-wg-text">{c.full_name}</span>
                      {c.phone && <span className="text-xs text-wg-muted ml-2">{c.phone}</span>}
                      {c.email && <span className="text-xs text-wg-muted ml-2">{c.email}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedCustomerId && (
              <div className="flex items-center gap-2 px-3 py-2 bg-wg-blue/10 border border-wg-blue/20 rounded-lg">
                <span className="text-sm text-wg-blue font-medium">Selected: {customerName}</span>
                <button
                  onClick={() => {
                    setSelectedCustomerId(null);
                    setCustomerName('');
                    setCustomerEmail('');
                    setCustomerPhone('');
                  }}
                  className="ml-auto text-xs text-wg-muted hover:text-wg-text"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-wg-border" />
              <span className="text-xs text-wg-muted">or enter new customer</span>
              <div className="flex-1 h-px bg-wg-border" />
            </div>

            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Full Name</label>
              <input value={customerName} onChange={(e) => { setCustomerName(e.target.value); setSelectedCustomerId(null); }} placeholder="Customer name" className={INPUT} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Email</label>
                <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className={INPUT} />
              </div>
              <div>
                <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Phone</label>
                <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="(555) 123-4567" className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Service Details</h2>
            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Service Type</label>
              <select value={serviceType} onChange={(e) => setServiceType(e.target.value)} className={INPUT + ' appearance-none'}>
                <option>Performance Inspection</option>
                <option>Routine Service</option>
                <option>Cosmetic Repair</option>
                <option>Pre-Purchase Inspection</option>
                <option>Delivery Verification</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Description</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the service needed..."
                className={INPUT + ' resize-none'}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="bg-wg-card rounded-xl border border-wg-border p-6 space-y-4">
            <h2 className="text-base font-medium text-wg-text">Initial Inspection</h2>
            <p className="text-sm text-wg-text2">
              Begin the intake inspection after saving. You&apos;ll document the vehicle&apos;s current condition across
              exterior, interior, engine, wheels, and glass sections.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {['Exterior Front', 'Exterior Rear', 'Driver Side', 'Passenger Side', 'Wheels & Tires', 'Glass & Lights', 'Interior', 'Engine Bay', 'Warning Lights', 'Final Notes'].map(
                (section) => (
                  <div key={section} className="flex items-center gap-2 p-3 bg-wg-bg2 rounded-lg border border-wg-border">
                    <div className="w-4 h-4 rounded-full border border-wg-border-light" />
                    <span className="text-sm text-wg-text2">{section}</span>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {submitError && (
          <p className="mt-4 text-sm text-red-400 text-center">{submitError}</p>
        )}

        <div className="flex justify-between mt-6">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          {step === STEPS.length - 1 ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Creating...' : 'Submit & Start Inspection'}
            </Button>
          ) : (
            <Button onClick={() => setStep(step + 1)}>
              Continue
            </Button>
          )}
        </div>
      </div>
    </AppShell>
  );
}
