'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-wg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-wg-blue/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-wg-blue font-bold text-2xl">W</span>
          </div>
          <h1 className="text-xl font-bold text-wg-text tracking-wide">WHITE GLOVE</h1>
          <p className="text-xs text-wg-muted tracking-widest mt-1">AUTO SERVICE</p>
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
          <Button className="w-full" size="lg">
            Sign In
          </Button>
          <p className="text-center text-xs text-wg-muted">
            Demo: john@whiteglove.com / password
          </p>
        </div>
      </div>
    </div>
  );
}
