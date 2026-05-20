'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Car, ClipboardCheck, MessageSquare, CalendarCheck } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/customer', label: 'Status', icon: Car, exact: true },
  { href: '/customer/inspection', label: 'Inspection', icon: ClipboardCheck },
  { href: '/customer/messages', label: 'Updates', icon: MessageSquare },
  { href: '/customer/delivery', label: 'Delivery', icon: CalendarCheck },
];

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-wg-bg">
      <header className="sticky top-0 z-40 bg-wg-bg2 border-b border-wg-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/customer" className="flex items-center gap-2.5">
            <Image src="/logo.svg" alt="White Glove Auto Service" width={32} height={32} className="rounded-lg" />
            <div>
              <div className="text-xs font-bold text-[#c8a45c] tracking-wide">WHITE GLOVE</div>
              <div className="text-[10px] text-[#c8a45c]/60 tracking-wider">AUTO SERVICE</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-wg-card flex items-center justify-center text-xs font-medium text-wg-text2 border border-wg-border">
              MJ
            </div>
          </div>
        </div>

        <nav className="max-w-3xl mx-auto px-4 flex gap-1 -mb-px">
          {NAV_ITEMS.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors',
                  active
                    ? 'border-[#c8a45c] text-[#c8a45c]'
                    : 'border-transparent text-wg-text2 hover:text-wg-text'
                )}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
