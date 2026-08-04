import { AppShell } from '@/components/layout/AppShell';
import { SettingsTabs } from './settings-tabs';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <div className="p-8">
        <h1 className="text-2xl font-semibold text-wg-text">Settings</h1>
        <p className="mt-1 text-sm text-wg-text2">Manage your organization, team, and preferences</p>
        <SettingsTabs />
        <div className="mt-6">{children}</div>
      </div>
    </AppShell>
  );
}
