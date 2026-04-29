-- =============================================================================
-- Raffu — let raffle owners delete entries before the draw starts
-- Mirrors the shape of entries_public_insert: same ownership + status gate.
-- After status leaves 'collecting' (drawing/complete), entries are immutable
-- so historical draws can't be tampered with.
-- =============================================================================

drop policy if exists "entries_owner_delete" on public.entries;
create policy "entries_owner_delete" on public.entries
  for delete using (
    exists (
      select 1 from public.raffles r
      where r.id = entries.raffle_id
        and r.owner_id = auth.uid()
        and r.status = 'collecting'
    )
  );
