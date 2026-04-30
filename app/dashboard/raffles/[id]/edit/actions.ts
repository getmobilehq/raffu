'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  PrizeMode,
  RaffleSetupState,
  SpinStyle,
  WinnerMode,
} from '../../new/actions';

const HEX = /^#[0-9a-fA-F]{6}$/;

function isWinnerMode(v: unknown): v is WinnerMode {
  return v === 'count' || v === 'percent';
}
function isPrizeMode(v: unknown): v is PrizeMode {
  return v === 'same' || v === 'per';
}
function isSpinStyle(v: unknown): v is SpinStyle {
  return v === 'slot' || v === 'flash' || v === 'shuffle' || v === 'wheel';
}

export async function updateRaffleAction(
  raffleId: string,
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

  const primaryColor = HEX.test(primaryColorRaw) ? primaryColorRaw : '#E10A0A';
  const accentColor = HEX.test(accentColorRaw) ? accentColorRaw : '#0050FF';
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

  const { error } = await supabase
    .from('raffles')
    .update({
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
    .eq('id', raffleId);

  if (error) return { ...echo, error: error.message };

  revalidatePath(`/dashboard/raffles/${raffleId}`);
  redirect(`/dashboard/raffles/${raffleId}`);
}
