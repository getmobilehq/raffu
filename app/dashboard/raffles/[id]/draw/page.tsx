import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DrawStage, type PoolEntry, type RevealedWinner } from './draw-stage';

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
}

interface EntryRow {
  id: string;
  first_name: string;
  last_name: string;
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
      'id, name, slug, status, primary_color, accent_color, prize_mode, prize_text, prize_list, winner_mode, winner_count, winner_percent, current_round'
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

  const allEntries: EntryRow[] = entries ?? [];

  // All winners across every round — used both for past-winner exclusion
  // and to render past rounds' winners statically alongside the current draw.
  const { data: allWinners } = await supabase
    .from('winners')
    .select('entry_id, position, prize, round')
    .eq('raffle_id', raffle.id)
    .order('round', { ascending: true })
    .order('position', { ascending: true });

  const winnerEntryIds = new Set((allWinners ?? []).map((w) => w.entry_id));

  // Pool excludes anyone who has ever won this raffle.
  const pool: PoolEntry[] = allEntries.filter((e) => !winnerEntryIds.has(e.id));

  // Idempotency is now scoped to the current round.
  const currentRoundWinners = (allWinners ?? []).filter(
    (w) => w.round === raffle.current_round
  );

  let revealed: RevealedWinner[];
  let freshDraw = false;

  if (currentRoundWinners.length > 0) {
    revealed = currentRoundWinners.map((w) => {
      const entry = allEntries.find((e) => e.id === w.entry_id);
      return {
        position: w.position,
        first_name: entry?.first_name ?? 'Unknown',
        last_name: entry?.last_name ?? '',
        prize: w.prize,
      };
    });
  } else if (pool.length === 0) {
    revealed = [];
  } else {
    revealed = await drawAndPersist(supabase, raffle, pool);
    freshDraw = true;
  }

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
        {pool.length === 0 && allEntries.length > 0 && (
          <p className="text-mist mt-3 leading-relaxed">
            Everyone who entered has already won a previous round.
          </p>
        )}
      </div>

      <DrawStage
        raffleId={raffle.id}
        pool={pool}
        winners={revealed}
        primaryColor={raffle.primary_color}
        accentColor={raffle.accent_color}
        freshDraw={freshDraw}
      />
    </div>
  );
}

async function drawAndPersist(
  supabase: ReturnType<typeof createClient>,
  raffle: RaffleRow,
  pool: EntryRow[]
): Promise<RevealedWinner[]> {
  const target =
    raffle.winner_mode === 'count'
      ? raffle.winner_count
      : Math.ceil((pool.length * raffle.winner_percent) / 100);
  const n = Math.max(1, Math.min(target, pool.length));

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const picked = shuffled.slice(0, n);

  const prizes = prizesForWinners(raffle, n);

  const rows = picked.map((entry, i) => ({
    raffle_id: raffle.id,
    entry_id: entry.id,
    position: i + 1,
    round: raffle.current_round,
    prize: prizes[i],
  }));

  const { error } = await supabase.from('winners').insert(rows);
  if (error) throw new Error(`Failed to persist winners: ${error.message}`);

  return picked.map((entry, i) => ({
    position: i + 1,
    first_name: entry.first_name,
    last_name: entry.last_name,
    prize: prizes[i],
  }));
}

function prizesForWinners(raffle: RaffleRow, n: number): (string | null)[] {
  if (raffle.prize_mode === 'same') {
    return Array.from({ length: n }, () => raffle.prize_text);
  }
  if (raffle.prize_mode === 'per' && raffle.prize_list) {
    const lines = raffle.prize_list
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return Array.from({ length: n }, (_, i) => lines[i] ?? null);
  }
  return Array.from({ length: n }, () => null);
}

function secureRandomInt(maxExclusive: number): number {
  // Rejection-sampled to remove modulo bias for this small range.
  const buf = new Uint32Array(1);
  const limit = Math.floor(0xffffffff / maxExclusive) * maxExclusive;
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % maxExclusive;
  }
}
