'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface DrawnWinner {
  entry_id: string;
  position: number;
  first_name: string;
  last_name: string;
  prize: string | null;
}

interface DrawNextResult {
  winner?: DrawnWinner;
  error?: string;
  done?: boolean;
}

export async function drawNextWinnerAction(
  raffleId: string
): Promise<DrawNextResult> {
  if (!raffleId) return { error: 'Missing raffle id.' };

  const supabase = createClient();

  // Re-read the raffle so we have authoritative target/prize/status data.
  const { data: raffle } = await supabase
    .from('raffles')
    .select(
      'id, status, prize_mode, prize_text, prize_list, winner_mode, winner_count, winner_percent, current_round'
    )
    .eq('id', raffleId)
    .maybeSingle();

  if (!raffle) return { error: 'Raffle not found.' };
  if (raffle.status !== 'drawing')
    return { error: 'Draw is not active for this raffle.' };

  const { data: entries } = await supabase
    .from('entries')
    .select('id, first_name, last_name')
    .eq('raffle_id', raffleId);

  const allEntries = entries ?? [];

  const { data: allWinners } = await supabase
    .from('winners')
    .select('entry_id, round, position')
    .eq('raffle_id', raffleId);

  const winnerEntryIds = new Set(
    (allWinners ?? []).map((w) => w.entry_id)
  );
  const currentRoundWinners = (allWinners ?? []).filter(
    (w) => w.round === raffle.current_round
  );

  const drawnSoFar = currentRoundWinners.length;
  const target = computeTargetCount(raffle, allEntries.length);

  if (drawnSoFar >= target) return { done: true };

  const pool = allEntries.filter((e) => !winnerEntryIds.has(e.id));
  if (pool.length === 0)
    return {
      error:
        'No eligible entrants left. Everyone in the pool has already won.',
    };

  const pick = pool[secureRandomInt(pool.length)];
  const position = drawnSoFar + 1;
  const prize = prizeForPosition(raffle, position);

  const { error: insertErr } = await supabase
    .from('winners')
    .insert({
      raffle_id: raffleId,
      entry_id: pick.id,
      round: raffle.current_round,
      position,
      prize,
    });

  if (insertErr) {
    // Race: two admin tabs both clicked at the same time and both computed
    // the same position. The unique (raffle_id, round, position) constraint
    // catches it; surface a friendly retry.
    if (insertErr.code === '23505')
      return {
        error:
          'Another spin landed at the same time. Refresh and try again.',
      };
    return { error: insertErr.message };
  }

  revalidatePath(`/dashboard/raffles/${raffleId}/draw`);

  return {
    winner: {
      entry_id: pick.id,
      position,
      first_name: pick.first_name,
      last_name: pick.last_name,
      prize,
    },
  };
}

export async function completeRaffleAction(formData: FormData) {
  const raffleId = String(formData.get('raffleId') ?? '');
  if (!raffleId) return;

  const supabase = createClient();

  const { error } = await supabase
    .from('raffles')
    .update({ status: 'complete' })
    .eq('id', raffleId)
    .eq('status', 'drawing');

  if (error) throw new Error(error.message);

  redirect(`/dashboard/raffles/${raffleId}`);
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

interface RaffleForCount {
  winner_mode: string;
  winner_count: number;
  winner_percent: number;
}

export function computeTargetCount(
  raffle: RaffleForCount,
  poolSize: number
): number {
  const target =
    raffle.winner_mode === 'count'
      ? raffle.winner_count
      : Math.ceil((poolSize * raffle.winner_percent) / 100);
  return Math.max(1, Math.min(target, poolSize));
}

function prizeForPosition(
  raffle: {
    prize_mode: string;
    prize_text: string | null;
    prize_list: string | null;
  },
  position: number
): string | null {
  if (raffle.prize_mode === 'same') return raffle.prize_text;
  if (raffle.prize_mode === 'per' && raffle.prize_list) {
    const lines = raffle.prize_list
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines[position - 1] ?? null;
  }
  return null;
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
