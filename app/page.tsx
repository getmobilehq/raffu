import Link from 'next/link';
import { BrandMark } from '@/components/brand-mark';

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* ------- NAV ------- */}
      <header className="border-b border-border bg-white/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <BrandMark />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-shadow hover:text-mist transition-colors"
            >
              Log in
            </Link>
            <Link href="/signup" className="btn btn-primary text-sm py-2.5 px-5">
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      {/* ------- HERO ------- */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-32 text-center">
        <p className="eyebrow mb-6 animate-fade-in-up">A raffle, well-run</p>
        <h1 className="font-heading font-black text-[clamp(3rem,8vw,6rem)] leading-[0.95] tracking-tightest mb-6 animate-fade-in-up">
          Raffle night,
          <br />
          with grace.
        </h1>
        <p className="text-lg text-mist max-w-[560px] mx-auto mb-10 leading-relaxed animate-fade-in-up">
          Scan-to-enter for your audience. A theatrical reveal for the room. A
          calm dashboard for you. Built for launches, socials, end-of-quarter
          giveaways.
        </p>
        <div className="flex gap-3 justify-center flex-wrap animate-fade-in-up">
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start your free month
          </Link>
          <Link href="#how" className="btn btn-ghost btn-lg">
            See how it works
          </Link>
        </div>
      </section>

      {/* ------- HOW IT WORKS ------- */}
      <section id="how" className="border-t border-border bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <p className="eyebrow text-center mb-4">How it works</p>
          <h2 className="font-heading text-3xl md:text-4xl text-center mb-16 tracking-tighter">
            Three steps. Eight seconds per&nbsp;entry.
          </h2>
          <ol className="grid md:grid-cols-3 gap-10 md:gap-6">
            {[
              {
                n: '01',
                t: 'Set it up',
                d: 'Name the raffle, upload your logo, pick two brand colours, set the winner rule.',
              },
              {
                n: '02',
                t: 'Project the QR',
                d: 'Your audience scans, types a name, they\u2019re in. Entries appear live on your dashboard.',
              },
              {
                n: '03',
                t: 'Press draw',
                d: 'Names roll, winners emerge bold with confetti and applause. One by one, until done.',
              },
            ].map((s) => (
              <li key={s.n} className="border-t border-border pt-6">
                <div className="font-heading font-black text-3xl text-mist mb-4">
                  {s.n}
                </div>
                <h3 className="font-heading font-bold text-xl mb-3 tracking-tight">
                  {s.t}
                </h3>
                <p className="text-mist leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------- FEATURES ------- */}
      <section className="border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                t: 'Scan-to-enter',
                d: 'A QR code that just works. Mobile-first form, no login required for participants.',
              },
              {
                t: 'Live winners panel',
                d: 'A theatrical reveal on the main view, a clean table of winners on the side &mdash; rows lock in as each draw completes.',
              },
              {
                t: 'Yours, fully branded',
                d: 'Your logo, two colours, your name on the stage. Minimal, tasteful, unmistakably you.',
              },
            ].map((f) => (
              <div key={f.t} className="card">
                <h3 className="font-heading font-bold text-xl mb-3 tracking-tight">
                  {f.t}
                </h3>
                <p className="text-mist leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------- PRICING ------- */}
      <section id="pricing" className="border-t border-border bg-white">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <p className="eyebrow text-center mb-4">Pricing</p>
          <h2 className="font-heading text-3xl md:text-4xl text-center mb-4 tracking-tighter">
            Start free. Stay, if it fits.
          </h2>
          <p className="text-mist text-center max-w-reading mx-auto mb-16">
            Every new account gets the full product for 30 days. No card at
            signup.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free trial card */}
            <div className="border border-shadow rounded-lg p-10 flex flex-col">
              <div className="eyebrow mb-4">Free trial</div>
              <div className="font-heading font-black text-5xl mb-2 tracking-tightest">
                £0
              </div>
              <div className="text-mist mb-8">for 30 days</div>
              <ul className="space-y-3 mb-10 text-[0.9375rem]">
                {[
                  'Unlimited raffles',
                  'Unlimited entries per raffle',
                  'Full branding (logo + 2 colours)',
                  'All spin styles',
                  'Live winners panel',
                ].map((x) => (
                  <li key={x} className="flex gap-3">
                    <span className="text-sand">&#10003;</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary btn-block mt-auto">
                Start free trial
              </Link>
            </div>

            {/* Pro card — coming soon */}
            <div className="border border-border rounded-lg p-10 flex flex-col bg-off-white relative">
              <div className="absolute top-4 right-4 text-[0.6875rem] font-medium uppercase tracking-wider text-mist border border-border rounded-full px-3 py-1 bg-white">
                Coming soon
              </div>
              <div className="eyebrow mb-4">Pro</div>
              <div className="font-heading font-black text-5xl mb-2 tracking-tightest">
                £10
              </div>
              <div className="text-mist mb-8">per month</div>
              <ul className="space-y-3 mb-10 text-[0.9375rem]">
                {[
                  'Everything in the trial',
                  'Unlimited raffle history',
                  'CSV export of entries and winners',
                  'Team seats (invite co-hosts)',
                  'Priority support',
                ].map((x) => (
                  <li key={x} className="flex gap-3 text-mist">
                    <span>&#8212;</span>
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="btn btn-ghost btn-block mt-auto opacity-60 cursor-not-allowed"
              >
                Notify me
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------- CTA ------- */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <h2 className="font-heading text-4xl md:text-5xl tracking-tighter mb-6">
            Your next raffle deserves a stage.
          </h2>
          <p className="text-mist mb-10 leading-relaxed">
            Set it up in under two minutes. Run it tonight.
          </p>
          <Link href="/signup" className="btn btn-primary btn-lg">
            Start your free month
          </Link>
        </div>
      </section>

      {/* ------- FOOTER ------- */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <BrandMark />
          <div className="text-sm text-mist">
            &copy; {new Date().getFullYear()} Raffu &middot; raffu.xyz
          </div>
        </div>
      </footer>
    </div>
  );
}
