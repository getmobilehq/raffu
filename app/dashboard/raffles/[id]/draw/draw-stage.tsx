'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import confetti from 'canvas-confetti';
import { spinWheel } from '@/lib/raffle/spin-wheel';
import {
  completeRaffleAction,
  drawNextWinnerAction,
  type DrawnWinner,
} from './actions';

export interface PoolEntry {
  id: string;
  first_name: string;
  last_name: string;
}

export interface RevealedWinner {
  entry_id: string;
  position: number;
  first_name: string;
  last_name: string;
  prize: string | null;
}

type Phase = 'idle' | 'spinning' | 'revealed';

const SPIN_TOTAL_MS = 2800;
const REVEAL_HOLD_MS = 1800;

export function DrawStage({
  raffleId,
  pool,
  drawnWinners,
  targetCount,
  primaryColor,
  accentColor,
  spinStyle,
  status,
}: {
  raffleId: string;
  pool: PoolEntry[];
  drawnWinners: RevealedWinner[];
  targetCount: number;
  primaryColor: string;
  accentColor: string;
  spinStyle: string;
  status: string;
}) {
  // Side panel hydrates with persisted winners; we append on each spin.
  const [winners, setWinners] = useState<RevealedWinner[]>(drawnWinners);
  // The just-drawn winner we're animating to. Cleared after reveal lands.
  const [pending, setPending] = useState<DrawnWinner | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [reelName, setReelName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const tickRef = useRef<number | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const remaining = targetCount - winners.length;
  const limitReached = remaining <= 0;
  const noPool = pool.length === 0;
  const isComplete = status === 'complete';

  // Animation: only runs while we have a `pending` winner and phase === 'spinning'.
  useEffect(() => {
    if (phase !== 'spinning' || !pending) return;
    if (pool.length === 0) {
      setPhase('revealed');
      return;
    }

    // ── Wheel branch ──────────────────────────────────────────────────────
    if (spinStyle === 'wheel') {
      const canvas = wheelCanvasRef.current;
      const winnerIndex = pool.findIndex((p) => p.id === pending.entry_id);
      if (!canvas || winnerIndex < 0) {
        setPhase('revealed');
        return;
      }
      const handle = spinWheel({
        canvas,
        entries: pool.map((p) => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
        })),
        winnerIndex,
        primaryColor,
        accentColor,
        onComplete: () => setPhase('revealed'),
      });
      return () => handle.cancel();
    }

    // ── Slot/flash/shuffle branch ─────────────────────────────────────────
    const start = performance.now();
    let interval = 50;

    const step = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= SPIN_TOTAL_MS) {
        setReelName(`${pending.first_name} ${pending.last_name}`);
        setPhase('revealed');
        return;
      }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setReelName(`${random.first_name} ${random.last_name}`);
      interval = Math.min(50 + (elapsed / SPIN_TOTAL_MS) * 200, 250);
      tickRef.current = window.setTimeout(step, interval);
    };
    step();
    return () => {
      if (tickRef.current !== null) window.clearTimeout(tickRef.current);
    };
  }, [phase, pending, pool, spinStyle, primaryColor, accentColor]);

  // After reveal: confetti, append to side panel, settle back to idle.
  useEffect(() => {
    if (phase !== 'revealed' || !pending) return;

    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 45,
      origin: { y: 0.55 },
      colors: [primaryColor, accentColor, '#FFFFFF'],
    });

    // Append (dedupe defensively in case Realtime / refresh races).
    setWinners((prev) =>
      prev.some((w) => w.position === pending.position)
        ? prev
        : [...prev, {
            entry_id: pending.entry_id,
            position: pending.position,
            first_name: pending.first_name,
            last_name: pending.last_name,
            prize: pending.prize,
          }]
    );

    const t = window.setTimeout(() => {
      setPending(null);
      setPhase('idle');
    }, REVEAL_HOLD_MS);

    return () => window.clearTimeout(t);
  }, [phase, pending, primaryColor, accentColor]);

  function handleSpin() {
    setError(null);
    startTransition(async () => {
      const result = await drawNextWinnerAction(raffleId);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.done) {
        // Server says target is reached — sync local state in case it drifted.
        return;
      }
      if (result.winner) {
        setPending(result.winner);
        setPhase('spinning');
      }
    });
  }

  // Empty everything — show the no-draw card.
  if (noPool && winners.length === 0) {
    return (
      <div className="card text-center max-w-xl mx-auto">
        <p className="eyebrow mb-3">No draw</p>
        <h2 className="font-heading font-bold text-3xl tracking-tight mb-3">
          No entries to draw from.
        </h2>
        <p className="text-mist leading-relaxed">
          Reopen this raffle from the admin view to collect entries again.
        </p>
      </div>
    );
  }

  const showingReel = phase === 'spinning' || phase === 'revealed';
  const inFlight = isPending || showingReel;

  return (
    <div className="max-w-3xl mx-auto">
      {showingReel && pending && (
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">
            Winner #{pending.position} of {targetCount}
          </p>

          {spinStyle === 'wheel' ? (
            <>
              <div
                className="mx-auto"
                style={{ maxWidth: 520, aspectRatio: '1 / 1' }}
              >
                <canvas
                  ref={wheelCanvasRef}
                  className="block w-full h-full"
                  aria-label="Spinning wheel of entries"
                />
              </div>
              {phase === 'revealed' && (
                <div
                  className="font-heading font-bold text-3xl md:text-5xl tracking-tighter mt-6"
                  style={{ color: primaryColor }}
                >
                  {pending.first_name} {pending.last_name}
                </div>
              )}
            </>
          ) : (
            <div
              className={`font-heading font-bold text-5xl md:text-7xl tracking-tighter min-h-[6rem] md:min-h-[8rem] flex items-center justify-center transition-all ${
                phase === 'revealed' ? 'scale-110' : ''
              }`}
              style={{
                color: phase === 'revealed' ? primaryColor : 'inherit',
              }}
            >
              {reelName}
            </div>
          )}

          {pending.prize && phase === 'revealed' && (
            <p className="text-mist mt-4 text-lg">{pending.prize}</p>
          )}
        </div>
      )}

      {!showingReel && !isComplete && (
        <div className="text-center mb-10">
          {!limitReached && !noPool ? (
            <>
              <button
                type="button"
                onClick={handleSpin}
                disabled={inFlight}
                className="btn btn-primary btn-lg disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isPending
                  ? 'Drawing…'
                  : winners.length === 0
                  ? `Spin for winner #1 of ${targetCount}`
                  : `Spin for winner #${winners.length + 1} of ${targetCount}`}
              </button>
              <p className="mt-3 text-sm text-mist">
                {remaining === 1
                  ? '1 winner left to draw.'
                  : `${remaining} winners left to draw.`}
              </p>
            </>
          ) : limitReached ? (
            <p className="eyebrow text-shadow">
              All {targetCount} winners drawn.
            </p>
          ) : (
            <p className="eyebrow text-shadow">
              No eligible entrants left in the pool.
            </p>
          )}
          {error && (
            <p className="mt-4 text-sm text-shadow border border-shadow inline-block px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>
      )}

      {winners.length > 0 && (
        <div className="mb-10">
          <h3 className="font-heading font-bold text-2xl tracking-tight mb-4">
            {isComplete ? 'Winners' : 'Drawn so far'}
          </h3>
          <ol className="bg-white border border-border rounded-lg divide-y divide-border">
            {winners.map((w) => (
              <li
                key={w.position}
                className="px-5 py-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span
                    className="inline-flex items-center justify-center w-8 h-8 rounded-full font-heading font-bold text-sm"
                    style={{
                      backgroundColor: primaryColor,
                      color: '#F5F0E8',
                    }}
                  >
                    {w.position}
                  </span>
                  <span className="text-shadow text-lg">
                    {w.first_name} {w.last_name}
                  </span>
                </div>
                {w.prize && (
                  <span className="text-mist text-sm text-right">
                    {w.prize}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {!isComplete && winners.length > 0 && !showingReel && (
        <div className="flex justify-center">
          <form action={completeRaffleAction}>
            <input type="hidden" name="raffleId" value={raffleId} />
            <button type="submit" className="btn btn-ghost btn-lg">
              Mark draw complete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
