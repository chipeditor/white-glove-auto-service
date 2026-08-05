'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';
import { User, Wrench, Shield, Monitor } from 'lucide-react';

const STAFF = [
  { name: 'Juan', role: 'Shop Manager', email: 'juan@ksbperformance.com', icon: Shield, roleKey: 'shop_admin' },
  { name: 'Aiden', role: 'Service Advisor', email: 'aiden@ksbperformance.com', icon: Monitor, roleKey: 'service_advisor' },
  { name: 'Geo', role: 'Tech', email: 'geo@ksbperformance.com', icon: Wrench, roleKey: 'technician' },
  { name: 'James', role: 'Tech', email: 'james@ksbperformance.com', icon: Wrench, roleKey: 'technician' },
];

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleStaffLogin(email: string) {
    setError('');
    setLoading(email);

    try {
      const res = await fetch('/api/test-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to set up test account');
        setLoading(null);
        return;
      }

      const { email: staffEmail, password } = await res.json();

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: staffEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(null);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Something went wrong');
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-wg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/KSB_WhiteGlove.png"
            alt="KSB White Glove Service"
            width={360}
            height={144}
            className="mx-auto"
            loading="eager"
            priority
          />
        </div>

        <div className="bg-wg-card rounded-2xl border border-wg-border p-6">
          <p className="text-sm text-wg-text2 text-center mb-4">Sign in as</p>

          <div className="space-y-2">
            {STAFF.map((person) => {
              const Icon = person.icon;
              const isLoading = loading === person.email;
              return (
                <button
                  key={person.email}
                  onClick={() => handleStaffLogin(person.email)}
                  disabled={loading !== null}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-wg-border bg-wg-bg2 hover:border-[#c8a45c]/40 hover:bg-wg-input transition-colors disabled:opacity-50 group"
                >
                  <div className="w-9 h-9 rounded-full bg-wg-card flex items-center justify-center border border-wg-border group-hover:border-[#c8a45c]/30">
                    <Icon size={16} className="text-[#c8a45c]" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-wg-text">{person.name}</p>
                    <p className="text-xs text-wg-muted">{person.role}</p>
                  </div>
                  {isLoading && (
                    <div className="w-4 h-4 border-2 border-[#c8a45c]/30 border-t-[#c8a45c] rounded-full animate-spin" />
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <p className="text-sm text-red-400 text-center mt-4">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
