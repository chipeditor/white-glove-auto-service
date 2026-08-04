'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  }

  async function handleDemoLogin() {
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: 'juan@ksbperformance.com',
      password: 'password123',
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
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

        <form onSubmit={handleSubmit} className="bg-wg-card rounded-2xl border border-wg-border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@whiteglove.com"
              className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#c8a45c] hover:bg-[#b8944c] text-[#1a1a2e] transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full px-5 py-2.5 rounded-lg text-sm font-medium bg-wg-card border border-wg-border text-[#c8a45c] hover:bg-wg-input transition-colors disabled:opacity-50"
          >
            Demo Login
          </button>
        </form>
      </div>
    </div>
  );
}
