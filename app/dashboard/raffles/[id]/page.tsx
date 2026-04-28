import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function RaffleAdminPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: raffle } = await supabase
    .from('raffles')
    .select('id, name, slug, status, primary_color, accent_color, created_at')
    .eq('id', params.id)
    .maybeSingle();

  if (!raffle) notFound();

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Dashboard
      </Link>

      <p className="eyebrow mt-6 mb-4">Raffle</p>
      <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
        {raffle.name}
      </h1>
      <p className="text-mist mb-12 leading-relaxed">
        /{raffle.slug} &middot; {raffle.status}
      </p>

      <div className="border border-dashed border-border rounded-lg px-8 py-16 text-center bg-white">
        <h2 className="font-heading font-bold text-2xl tracking-tight mb-3">
          Admin view ships next.
        </h2>
        <p className="text-mist max-w-sm mx-auto leading-relaxed">
          QR code, live entries, and the draw button land in v1.1 step 2.
        </p>
      </div>
    </div>
  );
}
