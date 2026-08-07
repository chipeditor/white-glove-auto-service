import { Bell, CheckCircle, AlertTriangle, Wrench, Sparkles } from 'lucide-react';
import { fetchCustomerUpdates, formatRelative, type CustomerUpdate } from '@/lib/customer-queries';
import { SignedOutNotice, EmptyCard } from '../empty-states';

export const dynamic = 'force-dynamic';

const TONES: Record<CustomerUpdate['tone'], { icon: typeof Bell; color: string; bg: string }> = {
  accent: { icon: Sparkles, color: 'text-[#c8a45c]', bg: 'bg-[#c8a45c]/10' },
  blue: { icon: Wrench, color: 'text-wg-blue', bg: 'bg-wg-blue/10' },
  green: { icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  amber: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
};

export default async function CustomerMessagesPage() {
  const view = await fetchCustomerUpdates();

  if (!view) return <SignedOutNotice />;

  const { updates } = view;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#c8a45c] font-medium tracking-wide mb-1">SERVICE UPDATES</p>
          <h2 className="text-lg font-semibold text-wg-text">Activity Feed</h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-wg-text2 shrink-0">
          <Bell size={13} />
          <span>
            {updates.length} update{updates.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {updates.length === 0 ? (
        <EmptyCard
          title="No updates yet"
          body="As soon as we check your vehicle in and start work, every milestone will show up here."
        />
      ) : (
        <div className="space-y-0">
          {updates.map((update, i) => {
            const tone = TONES[update.tone];
            const Icon = tone.icon;
            const isLast = i === updates.length - 1;
            const when = formatRelative(update.at);

            return (
              <div key={update.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full ${tone.bg} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={14} className={tone.color} />
                  </div>
                  {!isLast && <div className="w-px flex-1 min-h-[16px] bg-wg-border" />}
                </div>

                <div className={`flex-1 min-w-0 ${isLast ? 'pb-0' : 'pb-5'}`}>
                  <div className="bg-wg-card rounded-xl border border-wg-border p-4">
                    <h4 className="text-sm font-medium text-wg-text">{update.title}</h4>
                    {update.body && (
                      <p className="text-xs text-wg-text2 mt-1.5 leading-relaxed break-words">
                        {update.body}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-wg-border/50">
                      <span className="text-[11px] text-wg-muted truncate">{update.from ?? ''}</span>
                      {when && <span className="text-[11px] text-wg-muted shrink-0">{when}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
