'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Search,
  CheckSquare,
  Users,
  BarChart3,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/service-requests', label: 'Service Requests', icon: ClipboardList },
  { href: '/inspections', label: 'Inspections', icon: Search },
  { href: '/checklists', label: 'Checklists', icon: CheckSquare },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
];

const BOTTOM_ITEMS = [
  { href: '/notifications', label: 'Notifications', icon: Bell, badge: 8 },
  { href: '/settings/organization', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-wg-bg2 border-r border-wg-border flex flex-col z-40">
      <div className="p-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="White Glove Auto Service"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <div className="text-sm font-bold text-[#c8a45c] tracking-wide">WHITE GLOVE</div>
            <div className="text-xs text-[#c8a45c]/60 tracking-wider">AUTO SERVICE</div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-wg-blue/10 text-wg-blue'
                  : 'text-wg-text2 hover:text-wg-text hover:bg-wg-card'
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-2 space-y-0.5">
        {BOTTOM_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-wg-blue/10 text-wg-blue'
                  : 'text-wg-text2 hover:text-wg-text hover:bg-wg-card'
              )}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
              {'badge' in item && item.badge && (
                <span className="ml-auto bg-wg-blue text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="px-3 py-4 border-t border-wg-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-wg-card flex items-center justify-center text-xs font-medium text-wg-text2">
            JS
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-wg-text truncate">John Smith</div>
            <div className="text-xs text-wg-muted">Shop Admin</div>
          </div>
          <button className="text-wg-muted hover:text-wg-text transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
