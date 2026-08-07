import { LockKeyhole } from 'lucide-react';

/**
 * Rendered whenever the auth session is missing or the signed-in user has no
 * `customers` record. The portal never substitutes sample data for a real
 * identity.
 */
export function SignedOutNotice() {
  return (
    <div className="bg-wg-card rounded-2xl border border-wg-border p-6 sm:p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-wg-bg flex items-center justify-center mx-auto mb-4 border border-wg-border">
        <LockKeyhole size={20} className="text-wg-muted" />
      </div>
      <h2 className="text-base font-semibold text-wg-text">Sign in to see your vehicle</h2>
      <p className="text-sm text-wg-text2 mt-2 max-w-sm mx-auto leading-relaxed">
        We couldn&apos;t find a customer record for this session. Open the link your service advisor
        sent you, or contact the shop so they can connect your account.
      </p>
    </div>
  );
}

export function EmptyCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-wg-card rounded-2xl border border-wg-border p-6 text-center">
      <p className="text-sm font-medium text-wg-text">{title}</p>
      <p className="text-xs text-wg-text2 mt-1.5 max-w-sm mx-auto leading-relaxed">{body}</p>
    </div>
  );
}
