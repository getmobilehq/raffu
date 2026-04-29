'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { spinWheel } from '@/lib/raffle/spin-wheel';
import { completeRaffleAction } from './actions';

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

type Phase = 'idle' | 'spinning' | 'revealed' | 'done';

const SPIN_TOTAL_MS = 2800;
const REVEAL_HOLD_MS = 1800;
// Wheel runs ~6s per spec; let it land before the reveal hold.
const WHEEL_HOLD_MS = 1800;

export function DrawStage({
  raffleId,
  pool,
  winners,
  primaryColor,
  accentColor,
  spinStyle,
  freshDraw,
}: {
  raffleId: string;
  pool: PoolEntry[];
  winners: RevealedWinner[];
  primaryColor: string;
  accentColor: string;
  spinStyle: string;
  freshDraw: boolean;
}) {
  // On refresh after a draw, skip the animation entirely.
  const [phase, setPhase] = useState<Phase>(freshDraw ? 'spinning' : 'done');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [reelName, setReelName] = useState<string>(() =>
    freshDraw && pool.length > 0
      ? `${pool[0].first_name} ${pool[0].last_name}`
      : ''
  );
  const [revealedSoFar, setRevealedSoFar] = useState<RevealedWinner[]>(
    freshDraw ? [] : winners
  );

  const tickRef = useRef<number | null>(null);
  const wheelCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Reel cycling during 'spinning'.
  useEffect(() => {
    if (phase !== 'spinning') return;
    if (pool.length === 0 || winners.length === 0) return;

    const target = winners[currentIdx];

    // ── Wheel branch ──────────────────────────────────────────────────────
    if (spinStyle === 'wheel') {
      const canvas = wheelCanvasRef.current;
      const winnerIndex = pool.findIndex((p) => p.id === target.entry_id);
      if (!canvas || winnerIndex < 0) {
        // Canvas not mounted yet, or winner not in pool (shouldn't happen
        // — if we reach this branch the data is malformed). Skip animation
        // and reveal so the show goes on.
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

    // ── Slot/flash/shuffle branch (existing reel) ─────────────────────────
    const start = performance.now();
    let interval = 50;

    const step = () => {
      const elapsed = performance.now() - start;
      if (elapsed >= SPIN_TOTAL_MS) {
        setReelName(`${target.first_name} ${target.last_name}`);
        setPhase('revealed');
        return;
      }
      const random = pool[Math.floor(Math.random() * pool.length)];
      setReelName(`${random.first_name} ${random.last_name}`);
      // ease-out: interval grows, ticks slow down toward the end
      interval = Math.min(50 + (elapsed / SPIN_TOTAL_MS) * 200, 250);
      tickRef.current = window.setTimeout(step, interval);
    };

    step();
    return () => {
      if (tickRef.current !== null) window.clearTimeout(tickRef.current);
    };
  }, [phase, currentIdx, pool, winners, spinStyle, primaryColor, accentColor]);

  // After reveal: confetti, then advance.
  useEffect(() => {
    if (phase !== 'revealed') return;

    const winner = winners[currentIdx];
    setRevealedSoFar((prev) => [...prev, winner]);

    confetti({
      particleCount: 120,
      spread: 80,
      startVelocity: 45,
      origin: { y: 0.55 },
      colors: [primaryColor, accentColor, '#FFFFFF'],
    });

    const t = window.setTimeout(() => {
      if (currentIdx + 1 < winners.length) {
        setCurrentIdx((i) => i + 1);
        setPhase('spinning');
      } else {
        setPhase('done');
      }
    }, REVEAL_HOLD_MS);

    return () => window.clearTimeout(t);
  }, [phase, currentIdx, winners, primaryColor, accentColor]);

  // Empty pool — nothing to draw.
  if (pool.length === 0 || winners.length === 0) {
    return (
      <div className="card text-center max-w-xl mx-auto">
        <p className="eyebrow mb-3">No draw</p>
        <h2 className="font-heading font-bold text-3xl tracking-tight mb-3">
          No entries to draw from.
        </h2>
        <p className="text-mist leading-relaxed">
          Reopen entries from the SQL editor (set status back to
          &lsquo;collecting&rsquo;) and share the QR code, then come back.
        </p>
      </div>
    );
  }

  const showingReel = phase === 'spinning' || phase === 'revealed';
  const currentWinner = winners[currentIdx];

  return (
    <div className="max-w-3xl mx-auto">
      {showingReel && (
        <div className="text-center mb-12">
          <p className="eyebrow mb-4">
            Winner #{currentWinner.position} of {winners.length}
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
                  className="font-heading font-bold text-3xl md:text-5xl tracking-tighter mt-6 transition-all"
                  style={{ color: primaryColor }}
                >
                  {currentWinner.first_name} {currentWinner.last_name}
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

          {currentWinner.prize && phase === 'revealed' && (
            <p className="text-mist mt-4 text-lg">{currentWinner.prize}</p>
          )}
        </div>
      )}

      {revealedSoFar.length > 0 && (
        <div className="mb-10">
          <h3 className="font-heading font-bold text-2xl tracking-tight mb-4">
            {phase === 'done' ? 'Winners' : 'So far'}
          </h3>
          <ol className="bg-white border border-border rounded-lg divide-y divide-border">
            {revealedSoFar.map((w) => (
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

      {phase === 'done' && (
        <div className="flex justify-center">
          <form action={completeRaffleAction}>
            <input type="hidden" name="raffleId" value={raffleId} />
            <button type="submit" className="btn btn-primary btn-lg">
              Mark draw complete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
