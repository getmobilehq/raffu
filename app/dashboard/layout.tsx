import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { BrandMark } from '@/components/brand-mark';
import { TrialBanner } from '@/components/trial-banner';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware already guards this, but belt-and-braces:
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email, trial_ends_at, plan')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark href="/dashboard" />
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-sm text-mist">
              {profile?.first_name ?? ''} {profile?.last_name ?? ''}
            </div>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="text-sm font-medium text-shadow hover:text-mist transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {profile && (
        <TrialBanner
          trialEndsAt={profile.trial_ends_at}
          plan={profile.plan}
        />
      )}

      <main>{children}</main>
    </div>
  );
}
