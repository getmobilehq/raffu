'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export type WinnerMode = 'count' | 'percent';
export type PrizeMode = 'same' | 'per';
export type SpinStyle = 'slot' | 'flash' | 'shuffle';

export interface RaffleSetupState {
  error?: string;
  // Echo back so the form can repopulate on validation failure
  name?: string;
  primaryColor?: string;
  accentColor?: string;
  winnerMode?: WinnerMode;
  winnerCount?: number;
  winnerPercent?: number;
  prizeMode?: PrizeMode;
  prizeText?: string;
  prizeList?: string;
  spinStyle?: SpinStyle;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}

function randomSuffix(): string {
  // 5 lowercase alphanumeric chars, ~36^5 ≈ 60M — collisions are vanishingly rare
  // and the unique constraint backstops us anyway.
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let out = '';
  for (let i = 0; i < 5; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

function isWinnerMode(v: unknown): v is WinnerMode {
  return v === 'count' || v === 'percent';
}
function isPrizeMode(v: unknown): v is PrizeMode {
  return v === 'same' || v === 'per';
}
function isSpinStyle(v: unknown): v is SpinStyle {
  return v === 'slot' || v === 'flash' || v === 'shuffle';
}

export async function createRaffleAction(
  _prev: RaffleSetupState,
  formData: FormData
): Promise<RaffleSetupState> {
  const name = String(formData.get('name') ?? '').trim();
  const primaryColorRaw = String(formData.get('primaryColor') ?? '').trim();
  const accentColorRaw = String(formData.get('accentColor') ?? '').trim();
  const winnerModeRaw = formData.get('winnerMode');
  const winnerCountRaw = String(formData.get('winnerCount') ?? '').trim();
  const winnerPercentRaw = String(formData.get('winnerPercent') ?? '').trim();
  const prizeModeRaw = formData.get('prizeMode');
  const prizeTextRaw = String(formData.get('prizeText') ?? '').trim();
  const prizeListRaw = String(formData.get('prizeList') ?? '').trim();
  const spinStyleRaw = formData.get('spinStyle');

  const primaryColor = HEX.test(primaryColorRaw) ? primaryColorRaw : '#272727';
  const accentColor = HEX.test(accentColorRaw) ? accentColorRaw : '#D4AA7D';
  const winnerMode: WinnerMode = isWinnerMode(winnerModeRaw)
    ? winnerModeRaw
    : 'count';
  const prizeMode: PrizeMode = isPrizeMode(prizeModeRaw) ? prizeModeRaw : 'same';
  const spinStyle: SpinStyle = isSpinStyle(spinStyleRaw)
    ? spinStyleRaw
    : 'slot';

  const winnerCount = Math.max(
    1,
    Math.min(1000, Number.parseInt(winnerCountRaw, 10) || 3)
  );
  const winnerPercent = Math.max(
    1,
    Math.min(100, Number.parseInt(winnerPercentRaw, 10) || 10)
  );

  const echo: RaffleSetupState = {
    name,
    primaryColor,
    accentColor,
    winnerMode,
    winnerCount,
    winnerPercent,
    prizeMode,
    prizeText: prizeTextRaw,
    prizeList: prizeListRaw,
    spinStyle,
  };

  if (!name || name.length < 2)
    return { ...echo, error: 'Give the raffle a name (at least 2 characters).' };
  if (name.length > 80)
    return { ...echo, error: 'Name must be 80 characters or fewer.' };
  if (prizeMode === 'same' && !prizeTextRaw)
    return { ...echo, error: 'Describe the prize.' };
  if (prizeMode === 'per' && !prizeListRaw)
    return {
      ...echo,
      error: 'List one prize per line for tiered prize mode.',
    };

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Middleware should prevent this, but RLS would also reject — fail loud.
    return { ...echo, error: 'Your session expired. Please log in again.' };
  }

  const baseSlug = slugify(name) || 'raffle';
  const slug = `${baseSlug}-${randomSuffix()}`;

  const { data: inserted, error } = await supabase
    .from('raffles')
    .insert({
      owner_id: user.id,
      slug,
      name,
      primary_color: primaryColor,
      accent_color: accentColor,
      winner_mode: winnerMode,
      winner_count: winnerCount,
      winner_percent: winnerPercent,
      prize_mode: prizeMode,
      prize_text: prizeMode === 'same' ? prizeTextRaw : null,
      prize_list: prizeMode === 'per' ? prizeListRaw : null,
      spin_style: spinStyle,
    })
    .select('id')
    .single();

  if (error) {
    const friendly =
      error.code === '23505'
        ? 'That name produced a slug clash. Tweak the name and try again.'
        : error.message;
    return { ...echo, error: friendly };
  }

  redirect(`/dashboard/raffles/${inserted.id}`);
}
