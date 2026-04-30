import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DrawStage, type PoolEntry, type RevealedWinner } from './draw-stage';
import { computeTargetCount } from '@/lib/raffle/winner-count';

interface RaffleRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  primary_color: string;
  accent_color: string;
  prize_mode: string;
  prize_text: string | null;
  prize_list: string | null;
  winner_mode: string;
  winner_count: number;
  winner_percent: number;
  current_round: number;
  spin_style: string;
}

export default async function DrawPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: raffle } = await supabase
    .from('raffles')
    .select(
      'id, name, slug, status, primary_color, accent_color, prize_mode, prize_text, prize_list, winner_mode, winner_count, winner_percent, current_round, spin_style'
    )
    .eq('id', params.id)
    .maybeSingle<RaffleRow>();

  if (!raffle) notFound();

  // Status guard: only the drawing/complete states render here.
  if (raffle.status === 'collecting' || raffle.status === 'setup') {
    redirect(`/dashboard/raffles/${raffle.id}`);
  }

  const { data: entries } = await supabase
    .from('entries')
    .select('id, first_name, last_name')
    .eq('raffle_id', raffle.id)
    .order('created_at', { ascending: true });

  const allEntries = entries ?? [];

  const { data: allWinners } = await supabase
    .from('winners')
    .select('entry_id, position, prize, round')
    .eq('raffle_id', raffle.id)
    .order('round', { ascending: true })
    .order('position', { ascending: true });

  const winnerEntryIds = new Set((allWinners ?? []).map((w) => w.entry_id));

  // Pool excludes anyone who has ever won this raffle (any round).
  const pool: PoolEntry[] = allEntries.filter((e) => !winnerEntryIds.has(e.id));

  // Already-drawn winners for the current round (hydrated into the side panel).
  const drawnWinners: RevealedWinner[] = (allWinners ?? [])
    .filter((w) => w.round === raffle.current_round)
    .map((w) => {
      const entry = allEntries.find((e) => e.id === w.entry_id);
      return {
        entry_id: w.entry_id,
        position: w.position,
        first_name: entry?.first_name ?? 'Unknown',
        last_name: entry?.last_name ?? '',
        prize: w.prize,
      };
    });

  const targetCount = computeTargetCount(raffle, allEntries.length);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <Link
        href={`/dashboard/raffles/${raffle.id}`}
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Back to raffle
      </Link>

      <div className="mt-6 mb-12">
        <p className="eyebrow mb-4">
          {raffle.current_round > 1
            ? `Round ${raffle.current_round}`
            : 'Draw'}
        </p>
        <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter">
          {raffle.name}
        </h1>
        {pool.length === 0 && drawnWinners.length === 0 && (
          <p className="text-mist mt-3 leading-relaxed">
            {allEntries.length === 0
              ? 'No entries to draw from.'
              : 'Everyone who entered has already won a previous round.'}
          </p>
        )}
      </div>

      <DrawStage
        raffleId={raffle.id}
        pool={pool}
        drawnWinners={drawnWinners}
        targetCount={targetCount}
        primaryColor={raffle.primary_color}
        accentColor={raffle.accent_color}
        spinStyle={raffle.spin_style}
        status={raffle.status}
      />
    </div>
  );
}
