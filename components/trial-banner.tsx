interface TrialBannerProps {
  trialEndsAt: string;
  plan: string;
}

export function TrialBanner({ trialEndsAt, plan }: TrialBannerProps) {
  if (plan === 'pro') return null;

  const now = Date.now();
  const end = new Date(trialEndsAt).getTime();
  const daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  const expired = end < now;

  if (expired) {
    return (
      <div className="bg-brand-red text-off-white px-6 py-3 flex items-center justify-between gap-4 text-sm">
        <span>Your free trial has ended. Pro (£10/mo) is coming soon.</span>
        <span className="opacity-60">We&rsquo;ll email you the moment it&rsquo;s live.</span>
      </div>
    );
  }

  return (
    <div className="bg-off-white border-b border-border px-6 py-3 flex items-center justify-between gap-4 text-sm">
      <span>
        <span className="font-medium">{daysLeft} days</span> left in your free
        trial.
      </span>
      <span className="text-mist">Pro £10/mo &mdash; coming soon</span>
    </div>
  );
}
