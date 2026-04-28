import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name')
    .eq('id', user!.id)
    .single();

  const { data: raffles } = await supabase
    .from('raffles')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false });

  const firstName = profile?.first_name ?? 'there';
  const hasRaffles = Array.isArray(raffles) && raffles.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <p className="eyebrow mb-4">Dashboard</p>
      <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
        Welcome, {firstName}.
      </h1>
      <p className="text-mist mb-12 leading-relaxed max-w-reading">
        Your raffles live here. Create one, brand it, share the QR code, run
        the draw.
      </p>

      {!hasRaffles ? (
        <EmptyState />
      ) : (
        <RafflesList raffles={raffles!} />
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border border-dashed border-border rounded-lg px-8 py-16 text-center bg-white">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-off-white border border-border mb-6">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6 text-mist"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 9h6v6H9z" />
        </svg>
      </div>
      <h2 className="font-heading font-bold text-2xl tracking-tight mb-3">
        No raffles yet.
      </h2>
      <p className="text-mist mb-8 max-w-sm mx-auto leading-relaxed">
        Set up your first raffle in under two minutes. Name it, brand it, pick
        the winner rule. That&rsquo;s it.
      </p>
      <Link href="/dashboard/raffles/new" className="btn btn-primary btn-lg">
        Create raffle
      </Link>
    </div>
  );
}

function RafflesList({
  raffles,
}: {
  raffles: Array<{ id: string; name: string; slug: string; status: string; created_at: string }>;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-2xl tracking-tight">
          Your raffles
        </h2>
        <Link href="/dashboard/raffles/new" className="btn btn-primary">
          Create raffle
        </Link>
      </div>
      <div className="flex flex-col gap-3">
        {raffles.map((r) => (
        <div
          key={r.id}
          className="bg-white border border-border rounded-lg px-6 py-5 flex items-center justify-between gap-4"
        >
          <div>
            <div className="font-heading font-bold text-lg tracking-tight">
              {r.name}
            </div>
            <div className="text-sm text-mist mt-1">
              /{r.slug} &middot; {r.status}
            </div>
          </div>
          <Link
            href={`/dashboard/raffles/${r.id}`}
            className="btn btn-ghost text-sm py-2 px-4"
          >
            Open
          </Link>
        </div>
        ))}
      </div>
    </div>
  );
}
