'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-wg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logo.svg"
            alt="White Glove Auto Service"
            width={64}
            height={64}
            className="mx-auto mb-4"
          />
          <h1 className="text-xl font-bold text-[#c8a45c] tracking-wide">WHITE GLOVE</h1>
          <p className="text-xs text-[#c8a45c]/60 tracking-widest mt-1">AUTO SERVICE</p>
        </div>

        <div className="bg-wg-card rounded-2xl border border-wg-border p-6 space-y-4">
          <div>
            <label className="text-xs font-medium text-wg-text2 mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@whiteglove.com"
              className="w-full bg-wg-input border border-wg-border rounded-lg px-3 py-2.5 text-sm text-wg-text placeholder:text-wg-muted focus:outline-none focus:border-wg-blue/50"
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
            />
          </div>
          <button className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-[#c8a45c] hover:bg-[#b8944c] text-[#1a1a2e] transition-colors">
            Sign In
          </button>
          <p className="text-center text-xs text-wg-muted">
            Demo: john@whiteglove.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
