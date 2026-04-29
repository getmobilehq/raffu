'use client';

import { reopenRaffleAction } from './actions';

export function ReopenRaffleButton({
  raffleId,
  raffleName,
}: {
  raffleId: string;
  raffleName: string;
}) {
  function onSubmit(e: React.FormEvent) {
    const ok = window.confirm(
      `Reopen "${raffleName}" for a new round? Past winners stay locked out — only entrants who haven't already won can win the next draw.`
    );
    if (!ok) e.preventDefault();
  }

  return (
    <form action={reopenRaffleAction} onSubmit={onSubmit}>
      <input type="hidden" name="raffleId" value={raffleId} />
      <button type="submit" className="btn btn-primary">
        Reopen for new round
      </button>
    </form>
  );
}
