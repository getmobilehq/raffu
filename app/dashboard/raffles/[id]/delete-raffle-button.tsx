'use client';

import { deleteRaffleAction } from './actions';

export function DeleteRaffleButton({
  raffleId,
  raffleName,
}: {
  raffleId: string;
  raffleName: string;
}) {
  function onSubmit(e: React.FormEvent) {
    const ok = window.confirm(
      `Delete "${raffleName}"? This also removes all entries and winners. This cannot be undone.`
    );
    if (!ok) e.preventDefault();
  }

  return (
    <form action={deleteRaffleAction} onSubmit={onSubmit}>
      <input type="hidden" name="raffleId" value={raffleId} />
      <button
        type="submit"
        className="text-sm font-medium text-mist hover:text-brand transition-colors"
      >
        Delete this raffle
      </button>
    </form>
  );
}
