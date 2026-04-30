// Compute the target number of winners for a raffle, given the current pool
// size. Pulled out of the draw server actions file so a non-async helper can
// be imported from a server component without tripping the
// "Server actions must be async functions" build constraint.

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
