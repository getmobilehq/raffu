-- =============================================================================
-- Raffu — round tracking
-- A raffle can be "reopened" after completion to draw fresh winners. Rounds
-- distinguish which draw a winner belongs to so idempotency on the draw page
-- only matches the current round.
--
-- The (raffle_id, entry_id) uniqueness on winners is intentionally KEPT — it's
-- the database-level safety net that prevents the same person from winning
-- twice across rounds, even if the application's exclusion logic has a bug.
-- =============================================================================

alter table public.raffles
  add column if not exists current_round int not null default 1;

alter table public.winners
  add column if not exists round int not null default 1;

-- The original (raffle_id, position) uniqueness is too strict once rounds exist
-- (round 2 also has a position 1). Replace with a per-round constraint.
-- The auto-generated name from the inline declaration in the init migration
-- is winners_raffle_id_position_key.
alter table public.winners
  drop constraint if exists winners_raffle_id_position_key;

alter table public.winners
  add constraint winners_raffle_round_position_key
  unique (raffle_id, round, position);
