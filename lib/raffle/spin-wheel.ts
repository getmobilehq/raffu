// =============================================================================
// Raffu — wheel-of-fortune spin animation.
//
// Single export: spinWheel() — draws the wheel, animates rotation so the
// winner's segment centre lands directly under the pointer, then calls
// onComplete. Returns { cancel } to stop the rAF loop on unmount.
//
// Geometry conventions used inside this file:
//   * "compass" angle = clockwise from 12 o'clock, in radians (used for
//     human-meaningful positions like "winner at top = compass 0")
//   * canvas math angle = ctx.rotate's native frame (counterclockwise from
//     positive-x in standard math, but visually clockwise because canvas
//     y-axis points down)
//   * compass = canvas + π/2 (we ctx.rotate(-π/2 + rotation) to align them)
// =============================================================================

interface Entry {
  id: string;
  firstName: string;
  lastName: string;
}

export interface SpinWheelOptions {
  canvas: HTMLCanvasElement;
  entries: Entry[];
  /** Index into the caller's `entries` array. The wheel sorts internally
   *  for stable visual ordering and re-derives the winner's slot. */
  winnerIndex: number;
  /** Hex string. Used as one of the two alternating segment fills. */
  primaryColor: string;
  /** Hex string. The other alternating fill. */
  accentColor: string;
  onComplete: () => void;
}

export interface SpinWheelHandle {
  cancel: () => void;
}

const SHADOW = '#272727';
const OFF_WHITE = '#F5F0E8';
const SPIN_DURATION_MS = 6000;
const SPIN_FULL_ROTATIONS = 5;
const REDUCED_MOTION_FADE_MS = 200;
const POINTER_HEIGHT = 24;

// Beyond MAX_INDIVIDUAL_SLOTS, slots 25–34 of the visual wheel become
// "+N more" group segments — clustered at compass π (bottom of wheel)
// when the wheel is at rest.
const MAX_INDIVIDUAL_SLOTS = 50;
const GROUP_SLOT_COUNT = 10;
const VISUAL_SLOTS_WITH_GROUPS = MAX_INDIVIDUAL_SLOTS + GROUP_SLOT_COUNT; // 60
const GROUP_SLOTS_START = 25; // groups occupy slots 25..34 of the 60-slot layout

type Slot =
  | { kind: 'entry'; entry: Entry }
  | { kind: 'group'; count: number };

export function spinWheel(opts: SpinWheelOptions): SpinWheelHandle {
  const {
    canvas,
    entries,
    winnerIndex,
    primaryColor,
    accentColor,
    onComplete,
  } = opts;

  const ctx = canvas.getContext('2d');
  if (!ctx || entries.length === 0) {
    onComplete();
    return { cancel: () => {} };
  }

  const winnerId = entries[winnerIndex].id;
  // Stable visual ordering: id-sorted is deterministic across re-renders.
  const sortedEntries = [...entries].sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0
  );

  const { slots, winnerSlotIndex } = buildLayout(sortedEntries, winnerId);
  const totalSlots = slots.length;
  const targetRotation = computeTargetRotation(winnerSlotIndex, totalSlots);

  // devicePixelRatio scaling — caller is responsible for setting CSS
  // dimensions; we set the backing-store dimensions to match * dpr.
  const cssSize = canvas.clientWidth || canvas.clientHeight || 520;
  const dpr =
    typeof window !== 'undefined' && window.devicePixelRatio
      ? window.devicePixelRatio
      : 1;
  canvas.width = cssSize * dpr;
  canvas.height = cssSize * dpr;
  ctx.scale(dpr, dpr);

  const headingFont = readHeadingFontFamily();
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let rafId: number | null = null;
  let cancelled = false;

  const drawAt = (rotation: number, alpha = 1) => {
    ctx.clearRect(0, 0, cssSize, cssSize);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawWheel(
      ctx,
      slots,
      rotation,
      cssSize,
      primaryColor,
      accentColor,
      winnerId,
      headingFont,
      totalSlots
    );
    drawPointer(ctx, cssSize / 2, cssSize / 2 - wheelRadius(cssSize), POINTER_HEIGHT);
    ctx.restore();
  };

  const begin = () => {
    if (cancelled) return;

    if (reduceMotion) {
      // Snap to the winning rotation, fade the wheel in over 200ms.
      const startTime = performance.now();
      const fadeStep = () => {
        if (cancelled) return;
        const elapsed = performance.now() - startTime;
        const alpha = Math.min(1, elapsed / REDUCED_MOTION_FADE_MS);
        drawAt(targetRotation, alpha);
        if (alpha < 1) {
          rafId = requestAnimationFrame(fadeStep);
        } else {
          onComplete();
        }
      };
      fadeStep();
      return;
    }

    const startTime = performance.now();
    const step = () => {
      if (cancelled) return;
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / SPIN_DURATION_MS);
      const eased = cubicBezier(0.12, 0.8, 0.18, 1, t);
      drawAt(eased * targetRotation);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        onComplete();
      }
    };
    step();
  };

  // Wait for fonts so the first paint isn't a swap.
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      if (!cancelled) begin();
    });
  } else {
    begin();
  }

  return {
    cancel: () => {
      cancelled = true;
      if (rafId !== null) cancelAnimationFrame(rafId);
    },
  };
}

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------

function buildLayout(
  sortedEntries: Entry[],
  winnerId: string
): { slots: Slot[]; winnerSlotIndex: number } {
  const N = sortedEntries.length;

  // Small pools: every entry gets a slot.
  if (N <= MAX_INDIVIDUAL_SLOTS + GROUP_SLOT_COUNT) {
    const slots: Slot[] = sortedEntries.map((entry) => ({
      kind: 'entry',
      entry,
    }));
    const winnerSlotIndex = slots.findIndex(
      (s) => s.kind === 'entry' && s.entry.id === winnerId
    );
    return { slots, winnerSlotIndex };
  }

  // Large pools (> 60 entries): 50 individual slots + 10 group slots = 60
  // visual segments. Winner is always individual. Groups cluster at slots
  // 25..34 of the layout, which sit at compass π (bottom) when rotation = 0.
  const winner = sortedEntries.find((e) => e.id === winnerId);
  if (!winner) {
    // Shouldn't happen — caller's winnerIndex pointed at an entry whose id
    // we just sorted. Fall back to all-individual.
    return {
      slots: sortedEntries.map((entry) => ({ kind: 'entry', entry })),
      winnerSlotIndex: 0,
    };
  }
  const nonWinners = sortedEntries.filter((e) => e.id !== winnerId);
  const individuals = [winner, ...nonWinners.slice(0, MAX_INDIVIDUAL_SLOTS - 1)]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const grouped = nonWinners.slice(MAX_INDIVIDUAL_SLOTS - 1);

  // Distribute the (N - 50) leftovers across 10 group slots evenly.
  const groupCounts: number[] = [];
  for (let i = 0; i < GROUP_SLOT_COUNT; i++) {
    const start = Math.floor((i * grouped.length) / GROUP_SLOT_COUNT);
    const end = Math.floor(((i + 1) * grouped.length) / GROUP_SLOT_COUNT);
    groupCounts.push(end - start);
  }

  const slots: Slot[] = [];
  // First chunk of individuals occupies slots 0..GROUP_SLOTS_START - 1 (top).
  for (let i = 0; i < GROUP_SLOTS_START; i++) {
    slots.push({ kind: 'entry', entry: individuals[i] });
  }
  // Group slots cluster at the bottom.
  for (let i = 0; i < GROUP_SLOT_COUNT; i++) {
    slots.push({ kind: 'group', count: groupCounts[i] });
  }
  // Remaining individuals fill the rest (up the other side).
  for (let i = GROUP_SLOTS_START; i < MAX_INDIVIDUAL_SLOTS; i++) {
    slots.push({ kind: 'entry', entry: individuals[i] });
  }

  const winnerSlotIndex = slots.findIndex(
    (s) => s.kind === 'entry' && s.entry.id === winnerId
  );
  return { slots, winnerSlotIndex };
}

// -----------------------------------------------------------------------------
// Geometry
// -----------------------------------------------------------------------------

function wheelRadius(cssSize: number): number {
  // Leave headroom for the pointer above the rim.
  return cssSize / 2 - POINTER_HEIGHT - 4;
}

function computeTargetRotation(
  winnerSlotIndex: number,
  totalSlots: number
): number {
  // Slot i's centre, in our compass convention (clockwise from top), measured
  // before any rotation is applied:
  //     centre(i) = i * sliceAngle + sliceAngle / 2
  //
  // We want centre(winner) + rotation ≡ 0 (mod 2π) so the winner's centre
  // lands at compass 0 (top, under the pointer). Pick the smallest positive
  // rotation that satisfies this and is ≥ 5 full revolutions:
  //     rotation = (SPIN_FULL_ROTATIONS + 1) * 2π - centre(winner)
  // which lies in [(SPIN_FULL_ROTATIONS) * 2π + sliceAngle/2,
  //                (SPIN_FULL_ROTATIONS + 1) * 2π - sliceAngle/2].
  const sliceAngle = (2 * Math.PI) / totalSlots;
  const winnerCentre = winnerSlotIndex * sliceAngle + sliceAngle / 2;
  return (SPIN_FULL_ROTATIONS + 1) * 2 * Math.PI - winnerCentre;
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

function drawWheel(
  ctx: CanvasRenderingContext2D,
  slots: Slot[],
  rotation: number,
  cssSize: number,
  primaryColor: string,
  accentColor: string,
  winnerId: string,
  headingFont: string,
  totalSlots: number
) {
  const cx = cssSize / 2;
  const cy = cssSize / 2;
  const R = wheelRadius(cssSize);
  const sliceAngle = (2 * Math.PI) / totalSlots;
  // Global rotation applied below; combined "true canvas angle" for any
  // local angle θ is θ + rotateBy.
  const rotateBy = -Math.PI / 2 + rotation;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotateBy);

  // 1) Fills.
  for (let i = 0; i < totalSlots; i++) {
    const slot = slots[i];
    const startAngle = i * sliceAngle;
    const endAngle = (i + 1) * sliceAngle;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = colourFor(slot, i, totalSlots, primaryColor, accentColor);
    ctx.fill();
  }

  // 2) Subtle radial dividers — 1px shadow lines at low alpha so the eye
  // can read individual segments even when adjacent fills happen to match.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i < totalSlots; i++) {
    const angle = i * sliceAngle;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * R, Math.sin(angle) * R);
    ctx.stroke();
  }

  // 3) Labels (drawn after fills so they sit on top).
  for (let i = 0; i < totalSlots; i++) {
    const slot = slots[i];
    const label = labelFor(slot, totalSlots, isWinnerSlot(slot, winnerId));
    if (!label) continue;

    const localCentre = i * sliceAngle + sliceAngle / 2;
    const trueCanvasAngle = localCentre + rotateBy;
    const isWinner = isWinnerSlot(slot, winnerId);
    const fontSize = fontSizeFor(slot, totalSlots, isWinner);

    ctx.save();
    ctx.rotate(localCentre);
    ctx.font = `${isWinner ? 700 : 600} ${fontSize}px ${headingFont}`;
    ctx.fillStyle = OFF_WHITE;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Flip text 180° when the segment centre lies in the half of the wheel
    // where Math.cos(trueCanvasAngle) < 0 — otherwise labels read inverted.
    const needsFlip = Math.cos(trueCanvasAngle) < 0;
    const labelRadius = 0.65 * R;
    if (needsFlip) {
      ctx.rotate(Math.PI);
      ctx.fillText(label, -labelRadius, 0);
    } else {
      ctx.fillText(label, labelRadius, 0);
    }
    ctx.restore();
  }

  // 4) Outer rim — thin shadow stroke for a clean edge.
  ctx.beginPath();
  ctx.arc(0, 0, R, 0, 2 * Math.PI);
  ctx.strokeStyle = SHADOW;
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5) Centre hub — a small disc to hide the wedge tips meeting at origin.
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(8, R * 0.05), 0, 2 * Math.PI);
  ctx.fillStyle = SHADOW;
  ctx.fill();

  ctx.restore();
}

function drawPointer(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  height: number
) {
  // Triangle pointing DOWN: tip at (tipX, tipY) just touching the rim,
  // base 24px above. Filled with shadow so it contrasts with both the
  // red and blue segments equally.
  const halfBase = height / 2;
  ctx.save();
  ctx.fillStyle = SHADOW;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY + 4); // tip dips a few px into the rim
  ctx.lineTo(tipX - halfBase, tipY - height);
  ctx.lineTo(tipX + halfBase, tipY - height);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// -----------------------------------------------------------------------------
// Per-slot decisions
// -----------------------------------------------------------------------------

function isWinnerSlot(slot: Slot, winnerId: string): boolean {
  return slot.kind === 'entry' && slot.entry.id === winnerId;
}

function colourFor(
  slot: Slot,
  index: number,
  totalSlots: number,
  primaryColor: string,
  accentColor: string
): string {
  // Group segments are always shadow — they're a separate visual rhythm.
  if (slot.kind === 'group') return SHADOW;

  // Odd N: the LAST segment is shadow so the wrap-around doesn't put two
  // identical colours next to each other at compass 0 boundary.
  if (totalSlots % 2 === 1 && index === totalSlots - 1) return SHADOW;

  return index % 2 === 0 ? primaryColor : accentColor;
}

function labelFor(
  slot: Slot,
  totalSlots: number,
  isWinner: boolean
): string | null {
  if (slot.kind === 'group') {
    return slot.count > 0 ? `+${slot.count} more` : null;
  }
  const e = slot.entry;
  // Winner is ALWAYS individually labelled with full name regardless of
  // pool size. Per the brief.
  if (isWinner) return `${e.firstName} ${e.lastName}`.trim();
  if (totalSlots <= 24) return `${e.firstName} ${e.lastName}`.trim();
  if (totalSlots <= 39)
    return `${e.firstName} ${e.lastName.charAt(0)}.`.trim();
  // 40+ → first name only (smaller font handled in fontSizeFor).
  return e.firstName;
}

function fontSizeFor(
  slot: Slot,
  totalSlots: number,
  isWinner: boolean
): number {
  if (isWinner) return 22;
  if (slot.kind === 'group') return 14;
  if (totalSlots <= 24) return 18;
  if (totalSlots <= 39) return 16;
  if (totalSlots <= 59) return 14;
  return 12;
}

// -----------------------------------------------------------------------------
// Easing
// -----------------------------------------------------------------------------

function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
  t: number
): number {
  // Solve for parametric s where the bezier's X(s) = t, then return Y(s).
  // Newton's method, four iterations — ample for 60 fps.
  let s = t;
  for (let i = 0; i < 5; i++) {
    const omS = 1 - s;
    const x =
      3 * omS * omS * s * p1x + 3 * omS * s * s * p2x + s * s * s;
    const dx =
      3 * omS * omS * p1x -
      6 * omS * s * p1x +
      6 * omS * s * p2x -
      3 * s * s * p2x +
      3 * s * s;
    if (Math.abs(dx) < 1e-6) break;
    s -= (x - t) / dx;
    if (s < 0) s = 0;
    if (s > 1) s = 1;
  }
  const omS = 1 - s;
  return 3 * omS * omS * s * p1y + 3 * omS * s * s * p2y + s * s * s;
}

// -----------------------------------------------------------------------------
// Font wiring
// -----------------------------------------------------------------------------

function readHeadingFontFamily(): string {
  // next/font sets --font-heading on <html> to its subsetted family name.
  // Falling back to Georgia is fine if the var isn't present (e.g. SSR).
  if (typeof document === 'undefined') return 'Georgia, serif';
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue('--font-heading')
    .trim();
  return v ? `${v}, Georgia, serif` : 'Georgia, serif';
}
