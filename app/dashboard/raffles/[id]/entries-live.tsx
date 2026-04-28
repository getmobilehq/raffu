'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Entry {
  id: string;
  first_name: string;
  last_name: string;
  created_at: string;
}

export function EntriesLive({
  raffleId,
  initialEntries,
}: {
  raffleId: string;
  initialEntries: Entry[];
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
            className="px-5 py-3 flex items-center justify-between"
          >
            <span className="text-shadow">
              {e.first_name} {e.last_name}
            </span>
            <span className="text-xs text-mist">
              {formatTime(e.created_at)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
