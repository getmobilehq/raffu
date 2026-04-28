-- =============================================================================
-- Raffu — broadcast new entries via Realtime so the admin's live list updates
-- without a page refresh. Default replica identity (primary key) is sufficient
-- because we only care about INSERT events here.
-- =============================================================================

alter publication supabase_realtime add table public.entries;
