import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RaffleForm } from '@/components/raffle-form';
import type {
  PrizeMode,
  RaffleSetupState,
  SpinStyle,
  WinnerMode,
} from '../../new/actions';
import { updateRaffleAction } from './actions';

interface RaffleRow {
  id: string;
  name: string;
  primary_color: string;
  accent_color: string;
  winner_mode: WinnerMode;
  winner_count: number;
  winner_percent: number;
  prize_mode: PrizeMode;
  prize_text: string | null;
  prize_list: string | null;
  spin_style: SpinStyle;
}

export default async function EditRafflePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: raffle } = await supabase
    .from('raffles')
    .select(
      'id, name, primary_color, accent_color, winner_mode, winner_count, winner_percent, prize_mode, prize_text, prize_list, spin_style'
    )
    .eq('id', params.id)
    .maybeSingle<RaffleRow>();

  if (!raffle) notFound();

  const initialValues: Partial<RaffleSetupState> = {
    name: raffle.name,
    primaryColor: raffle.primary_color,
    accentColor: raffle.accent_color,
    winnerMode: raffle.winner_mode,
    winnerCount: raffle.winner_count,
    winnerPercent: raffle.winner_percent,
    prizeMode: raffle.prize_mode,
    prizeText: raffle.prize_text ?? '',
    prizeList: raffle.prize_list ?? '',
    spinStyle: raffle.spin_style,
  };

  const action = updateRaffleAction.bind(null, raffle.id);

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link
        href={`/dashboard/raffles/${raffle.id}`}
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Back to raffle
      </Link>

      <p className="eyebrow mt-6 mb-4">Edit raffle</p>
      <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
        {raffle.name}
      </h1>
      <p className="text-mist mb-12 leading-relaxed">
        Tweak the name, colors, prize, or winner rule. The shareable link
        (slug) stays the same.
      </p>

      <RaffleForm
        action={action}
        initialValues={initialValues}
        submitLabel="Save changes"
        pendingLabel="Saving…"
      />
    </div>
  );
}
