'use client';

import { Sidebar } from './Sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-wg-bg">
      <Sidebar />
      <main className="ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  );
}
