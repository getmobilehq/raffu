'use client';

import Link from 'next/link';
import { RaffleForm } from '@/components/raffle-form';
import { createRaffleAction } from './actions';

export default function NewRafflePage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-mist hover:text-shadow transition-colors"
      >
        &larr; Dashboard
      </Link>

      <p className="eyebrow mt-6 mb-4">New raffle</p>
      <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tighter mb-3">
        Set it up.
      </h1>
      <p className="text-mist mb-12 leading-relaxed">
        Name it, brand it, pick the winner rule. You can edit anything before
        the draw.
      </p>

      <RaffleForm
        action={createRaffleAction}
        submitLabel="Create raffle"
        pendingLabel="Creating raffle…"
        showSlugField
      />
    </div>
  );
}
