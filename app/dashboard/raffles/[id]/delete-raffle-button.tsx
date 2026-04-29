'use client';

import { deleteRaffleAction } from './actions';

export function DeleteRaffleButton({
  raffleId,
  raffleName,
  status,
}: {
  raffleId: string;
  raffleName: string;
  status: string;
}) {
  function onSubmit(e: React.FormEvent) {
    const message =
      status === 'collecting'
        ? `Delete "${raffleName}"? Entries received so far will be lost. This cannot be undone.`
        : status === 'drawing'
        ? `Delete "${raffleName}"? You're mid-draw — entries and any drawn winners will be lost. This cannot be undone.`
        : status === 'complete'
        ? `Delete "${raffleName}"? This also removes all entries and winners. This cannot be undone.`
        : `Delete "${raffleName}"? This cannot be undone.`;

    if (!window.confirm(message)) e.preventDefault();
  }

  return (
    <form action={deleteRaffleAction} onSubmit={onSubmit}>
      <input type="hidden" name="raffleId" value={raffleId} />
      <button
        type="submit"
        className="text-sm font-medium text-mist hover:text-brand-red transition-colors"
      >
        Delete this raffle
      </button>
    </form>
  );
}
