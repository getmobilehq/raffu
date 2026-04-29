import Link from 'next/link';
import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { EntriesLive } from './entries-live';
import { startDrawAction } from './actions';
import { DeleteRaffleButton } from './delete-raffle-button';
import { ReopenRaffleButton } from './reopen-raffle-button';

export default async function RaffleAdminPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: raffle } = await supabase
    .from('raffles')
    .select(
      'id, name, slug, status, primary_color, accent_color, prize_text, prize_list, prize_mode, winner_mode, winner_count, winner_percent'
    )
    .eq('id', params.id)
    .maybeSingle();

  if (!raffle) notFound();

  const { data: entries } = await supabase
    .from('entries')
    .select('id, first_name, last_name, created_at')
    .eq('raffle_id', raffle.id)
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const entryUrl = `${appUrl}/r/${raffle.slug}`;
  const qrSvg = await QRCode.toString(entryUrl, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: {
      dark: raffle.primary_color,
      light: '#FFFFFF',
    },
  });

  const isCollecting = raffle.status === 'collecting';
  const isDrawing = raffle.status === 'drawing';
  const isComplete = raffle.status === 'complete';

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Dashboard
      </Link>

      <div className="mt-6 mb-12 flex items-start justify-between gap-6 flex-wrap">
        <div>
          <p className="eyebrow mb-4">Raffle</p>
          <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
            {raffle.name}
          </h1>
          <p className="text-mist leading-relaxed">
            <code className="text-shadow">/{raffle.slug}</code> &middot;{' '}
            <StatusBadge status={raffle.status} />
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/dashboard/raffles/${raffle.id}/edit`}
            className="btn btn-ghost"
          >
            Edit
          </Link>
          {(isDrawing || isComplete) && (
            <Link
              href={`/dashboard/raffles/${raffle.id}/draw`}
              className={isComplete ? 'btn btn-ghost' : 'btn btn-primary'}
            >
              {isComplete ? 'View results' : 'Open draw'}
            </Link>
          )}
          {isComplete && (
            <ReopenRaffleButton
              raffleId={raffle.id}
              raffleName={raffle.name}
            />
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-8">
        {/* QR + share link */}
        <div>
          <div className="bg-white border border-border rounded-lg p-5">
            <div
              className="aspect-square w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
          <div className="mt-4">
            <p className="field-label">Share link</p>
            <div className="text-sm text-shadow break-all bg-white border border-border rounded px-3 py-2 font-mono">
              {entryUrl}
            </div>
          </div>
          <div className="mt-6">
            <p className="field-label">Prize</p>
            <PrizeSummary
              mode={raffle.prize_mode}
              text={raffle.prize_text}
              list={raffle.prize_list}
            />
            <p className="field-label mt-4">Winners</p>
            <p className="text-sm text-shadow">
              {raffle.winner_mode === 'count'
                ? `${raffle.winner_count} winner${raffle.winner_count === 1 ? '' : 's'}`
                : `${raffle.winner_percent}% of entries`}
            </p>
          </div>
        </div>

        {/* Live entries + draw */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-2xl tracking-tight">
              Live entries
            </h2>
            {isCollecting && (
              <form action={startDrawAction}>
                <input type="hidden" name="raffleId" value={raffle.id} />
                <button type="submit" className="btn btn-primary">
                  Start the draw
                </button>
              </form>
            )}
          </div>
          <EntriesLive
            raffleId={raffle.id}
            initialEntries={entries ?? []}
          />
        </div>
      </div>

      <div className="mt-16 pt-8 border-t border-border">
        <DeleteRaffleButton
          raffleId={raffle.id}
          raffleName={raffle.name}
          status={raffle.status}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'collecting'
      ? 'Collecting entries'
      : status === 'drawing'
      ? 'Drawing'
      : status === 'complete'
      ? 'Complete'
      : 'Setup';
  return <span className="text-shadow">{label}</span>;
}

function PrizeSummary({
  mode,
  text,
  list,
}: {
  mode: string;
  text: string | null;
  list: string | null;
}) {
  if (mode === 'same' && text) {
    return <p className="text-sm text-shadow">{text}</p>;
  }
  if (mode === 'per' && list) {
    const lines = list.split('\n').filter((l) => l.trim().length > 0);
    return (
      <ol className="text-sm text-shadow list-decimal list-inside space-y-1">
        {lines.map((l, i) => (
          <li key={i}>{l.trim()}</li>
        ))}
      </ol>
    );
  }
  return <p className="text-sm text-mist">No prize set</p>;
}
