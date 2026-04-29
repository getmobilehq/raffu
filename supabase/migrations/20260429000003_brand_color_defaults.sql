-- =============================================================================
-- Raffu — update raffles default colours to match the new brand palette
-- Existing rows keep whatever the admin chose. Only the column DEFAULTs change,
-- which take effect on rows inserted without explicit colour values.
-- =============================================================================

alter table public.raffles
  alter column primary_color set default '#E10A0A';

alter table public.raffles
  alter column accent_color set default '#0050FF';
