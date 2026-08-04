'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Building2, Users, Shield } from 'lucide-react';

const TABS = [
  { href: '/settings/organization', label: 'Organization', icon: Building2 },
  { href: '/settings/team', label: 'Team', icon: Users },
  { href: '/settings/audit-log', label: 'Audit Log', icon: Shield },
];

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 mt-5 border-b border-wg-border">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px',
              active
                ? 'border-wg-blue text-wg-blue'
                : 'border-transparent text-wg-text2 hover:text-wg-text'
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
