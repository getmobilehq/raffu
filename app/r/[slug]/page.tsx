import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EntryForm } from './entry-form';

export default async function PublicRafflePage({
  params,
}: {
  params: { slug: string };
}) {
  const supabase = createClient();

  const { data: raffle } = await supabase
    .from('raffles')
    .select('id, name, slug, status, primary_color, accent_color, prize_text')
    .eq('slug', params.slug)
    .maybeSingle();

  // RLS hides setup/complete rows from anon, so missing rows look identical
  // to "not yet collecting" or "wrapped up". A 404 covers both honestly.
  if (!raffle) notFound();

  const brandStyle = {
    '--color-primary': raffle.primary_color,
    '--color-accent': raffle.accent_color,
    '--color-primary-contrast': '#F5F0E8',
  } as React.CSSProperties;

  const closed = raffle.status !== 'collecting';

  return (
    <div className="min-h-screen flex flex-col" style={brandStyle}>
      <main className="flex-1 flex items-center justify-center py-16 px-6">
        <div className="w-full max-w-[440px]">
          <p className="eyebrow mb-4">You&rsquo;re invited</p>
          <h1 className="font-heading font-bold text-[2.5rem] leading-tight tracking-tighter mb-3">
            {raffle.name}
          </h1>
          {raffle.prize_text && (
            <p className="text-mist mb-10 leading-relaxed">
              Prize: <span className="text-shadow">{raffle.prize_text}</span>
            </p>
          )}
          {!raffle.prize_text && (
            <p className="text-mist mb-10 leading-relaxed">
              Drop your name to be in the draw.
            </p>
          )}

          {closed ? (
            <div className="card text-center">
              <p className="eyebrow mb-3">Closed</p>
              <h2 className="font-heading font-bold text-2xl tracking-tight mb-3">
                The draw is on.
              </h2>
              <p className="text-mist leading-relaxed">
                Entries are closed for this raffle. Watch the screen for
                winners.
              </p>
            </div>
          ) : (
            <EntryForm raffleId={raffle.id} />
          )}

          <p className="mt-6 text-xs text-mist text-center">
            Powered by Raffu
          </p>
        </div>
      </main>
    </div>
  );
}
