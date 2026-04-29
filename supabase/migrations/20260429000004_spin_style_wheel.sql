-- =============================================================================
-- Raffu — widen spin_style check to allow 'wheel'
-- The original constraint was declared inline in the init migration as
--   check (spin_style in ('slot','flash','shuffle'))
-- which Postgres auto-names raffles_spin_style_check.
-- Default stays 'slot'.
-- =============================================================================

alter table public.raffles
  drop constraint if exists raffles_spin_style_check;

alter table public.raffles
  add constraint raffles_spin_style_check
  check (spin_style in ('slot', 'flash', 'shuffle', 'wheel'));
