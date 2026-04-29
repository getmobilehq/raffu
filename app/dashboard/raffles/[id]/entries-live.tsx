'use client';

import { useEffect, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteEntryAction } from './actions';

export interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export function EntriesLive({
  raffleId,
  initialEntries,
  canDelete,
}: {
  raffleId: string;
  initialEntries: Entry[];
  canDelete: boolean;
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`entries:${raffleId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entries',
          filter: `raffle_id=eq.${raffleId}`,
        },
        (payload) => {
          const row = payload.new as Entry;
          setEntries((prev) =>
            prev.some((e) => e.id === row.id) ? prev : [row, ...prev]
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [raffleId]);

  function removeFromState(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }

  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg px-6 py-12 text-center bg-white">
        <p className="text-mist text-sm">
          No entries yet. Share the QR code or link to get the first one.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-sm text-mist mb-3">
        {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
      </div>
      <ul className="bg-white border border-border rounded-lg divide-y divide-border">
        {entries.map((e) => (
          <li
            key={e.id}
            className="px-5 py-3 flex items-center justify-between gap-3"
          >
            <span className="text-shadow">
              {e.first_name} {e.last_name}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-mist">
                {formatTime(e.created_at)}
              </span>
              {canDelete && (
                <DeleteEntryButton
                  entry={e}
                  onDeleted={() => removeFromState(e.id)}
                />
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DeleteEntryButton({
  entry,
  onDeleted,
}: {
  entry: Entry;
  onDeleted: () => void;
}) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const ok = window.confirm(
      `Remove ${entry.first_name} ${entry.last_name} from this raffle?`
    );
    if (!ok) return;
    startTransition(async () => {
      await deleteEntryAction(entry.id);
      onDeleted();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-label={`Remove ${entry.first_name} ${entry.last_name}`}
      className="text-mist hover:text-brand transition-colors text-lg leading-none px-1 disabled:opacity-50"
    >
      &times;
    </button>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
