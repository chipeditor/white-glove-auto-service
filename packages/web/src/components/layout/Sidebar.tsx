'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import {
  LayoutDashboard,
  Car,
  ClipboardList,
  Search,
  CheckSquare,
  Users,
  BarChart3,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[];
};

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehicles', label: 'Vehicles', icon: Car, roles: ['super_admin', 'shop_admin', 'service_advisor', 'technician', 'delivery_specialist'] },
  { href: '/service-requests', label: 'Service Requests', icon: ClipboardList, roles: ['super_admin', 'shop_admin', 'service_advisor', 'technician'] },
  { href: '/inspections', label: 'Inspections', icon: Search, roles: ['super_admin', 'shop_admin', 'service_advisor', 'technician'] },
  { href: '/checklists', label: 'Checklists', icon: CheckSquare, roles: ['super_admin', 'shop_admin', 'service_advisor', 'technician', 'delivery_specialist'] },
  { href: '/customers', label: 'Customers', icon: Users, roles: ['super_admin', 'shop_admin', 'service_advisor'] },
  { href: '/schedule', label: 'Schedule', icon: CalendarDays, roles: ['super_admin', 'shop_admin', 'service_advisor', 'technician'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['super_admin', 'shop_admin'] },
];

const BOTTOM_ITEMS = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings/organization', label: 'Settings', icon: Settings },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  shop_admin: 'Shop Admin',
  service_advisor: 'Service Advisor',
  technician: 'Technician',
  delivery_specialist: 'Delivery Specialist',
  customer: 'Customer',
};

function getInitials(name: string | undefined | null): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, role } = useAuth();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-wg-bg2 border-r border-wg-border flex flex-col z-40">
      <div className="p-4 pb-3">
        <Link href="/dashboard" className="block">
          <Image
            src="/KSB_WhiteGlove.png"
            alt="KSB White Glove Service"
            width={220}
            height={88}
            className="w-full h-auto"
            priority
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.filter((item) => !item.roles || (role && item.roles.includes(role))).map((item) => {
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
            </Link>
          );
        })}
      </div>

      <div className="px-3 py-4 border-t border-wg-border">
        <div className="flex items-center gap-3 px-3">
          <div className="w-8 h-8 rounded-full bg-wg-card flex items-center justify-center text-xs font-medium text-wg-text2">
            {getInitials(profile?.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-wg-text truncate">
              {profile?.full_name ?? 'Loading…'}
            </div>
            <div className="text-xs text-wg-muted">
              {role ? ROLE_LABELS[role] ?? role : ''}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-wg-muted hover:text-wg-text transition-colors"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
