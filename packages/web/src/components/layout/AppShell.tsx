'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-wg-bg">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-wg-bg2 border-b border-wg-border flex items-center px-4 z-50" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-wg-text2 hover:text-wg-text"
        >
          <Menu size={20} />
        </button>
        <span className="ml-2 text-sm font-medium text-wg-text">KSB White Glove</span>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-[260px] min-h-screen pt-14 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
