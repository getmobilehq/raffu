-- =============================================================================
-- Raffu — initial schema
-- Run in Supabase SQL editor, or via `supabase db push` with the CLI.
-- =============================================================================

-- Ensure pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles — extends auth.users with product-level fields
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  first_name      text not null,
  last_name       text not null,
  email           text not null,
  trial_ends_at   timestamptz not null default (now() + interval '30 days'),
  plan            text not null default 'trial' check (plan in ('trial','pro','expired')),
  created_at      timestamptz not null default now()
);

comment on table public.profiles is 'Raffu user profiles; 1:1 with auth.users.';

-- -----------------------------------------------------------------------------
-- raffles — a single raffle owned by one admin
-- -----------------------------------------------------------------------------
create table if not exists public.raffles (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references auth.users(id) on delete cascade,
  slug             text unique not null,
  name             text not null,
  logo_url         text,
  primary_color    text not null default '#272727',
  accent_color     text not null default '#D4AA7D',
  winner_mode      text not null default 'count' check (winner_mode in ('count','percent')),
  winner_count     int  not null default 3,
  winner_percent   int  not null default 10,
  prize_mode       text not null default 'same' check (prize_mode in ('same','per')),
  prize_text       text,
  prize_list       text,
  spin_style       text not null default 'slot' check (spin_style in ('slot','flash','shuffle')),
  status           text not null default 'collecting' check (status in ('setup','collecting','drawing','complete')),
  created_at       timestamptz not null default now()
);

create index if not exists raffles_owner_idx on public.raffles(owner_id);
create index if not exists raffles_slug_idx on public.raffles(slug);

-- -----------------------------------------------------------------------------
-- entries — participants who scanned in
-- -----------------------------------------------------------------------------
create table if not exists public.entries (
  id          uuid primary key default gen_random_uuid(),
  raffle_id   uuid not null references public.raffles(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  created_at  timestamptz not null default now()
);

create index if not exists entries_raffle_idx on public.entries(raffle_id, created_at);

-- -----------------------------------------------------------------------------
-- winners — drawn results, in order
-- -----------------------------------------------------------------------------
create table if not exists public.winners (
  id          uuid primary key default gen_random_uuid(),
  raffle_id   uuid not null references public.raffles(id) on delete cascade,
  entry_id    uuid not null references public.entries(id) on delete cascade,
  position    int  not null,
  prize       text,
  created_at  timestamptz not null default now(),
  unique (raffle_id, entry_id),
  unique (raffle_id, position)
);

create index if not exists winners_raffle_idx on public.winners(raffle_id, position);

-- =============================================================================
-- Trigger: auto-create a profile when a user signs up
-- auth.users raw_user_meta_data carries {first_name, last_name} from signUp()
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS policies
-- =============================================================================

-- profiles -----------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_self_select" on public.profiles;
create policy "profiles_self_select" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

-- raffles ------------------------------------------------------------
alter table public.raffles enable row level security;

drop policy if exists "raffles_owner_all" on public.raffles;
create policy "raffles_owner_all" on public.raffles
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Public can SELECT a raffle by slug (for the entry page), but only
-- non-sensitive fields; we'll restrict the columns at query time in the app.
drop policy if exists "raffles_public_read" on public.raffles;
create policy "raffles_public_read" on public.raffles
  for select using (status in ('collecting','drawing'));

-- entries ------------------------------------------------------------
alter table public.entries enable row level security;

-- Owner of the raffle can read all entries
drop policy if exists "entries_owner_select" on public.entries;
create policy "entries_owner_select" on public.entries
  for select using (
    exists (select 1 from public.raffles r where r.id = entries.raffle_id and r.owner_id = auth.uid())
  );

-- Anyone can INSERT an entry into a raffle that's currently collecting
drop policy if exists "entries_public_insert" on public.entries;
create policy "entries_public_insert" on public.entries
  for insert with check (
    exists (select 1 from public.raffles r where r.id = raffle_id and r.status = 'collecting')
  );

-- winners ------------------------------------------------------------
alter table public.winners enable row level security;

drop policy if exists "winners_owner_all" on public.winners;
create policy "winners_owner_all" on public.winners
  for all using (
    exists (select 1 from public.raffles r where r.id = winners.raffle_id and r.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.raffles r where r.id = raffle_id and r.owner_id = auth.uid())
  );

-- Public can read winners of raffles they entered (for transparency)
drop policy if exists "winners_public_read" on public.winners;
create policy "winners_public_read" on public.winners
  for select using (
    exists (select 1 from public.raffles r where r.id = winners.raffle_id and r.status in ('drawing','complete'))
  );
