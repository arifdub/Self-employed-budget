-- ============================================================
-- SE Budget — database schema  (v0.7.0)
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Safe to run more than once.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES
-- One row per user, created automatically on sign-up.
-- auth.users is managed by Supabase and cannot be modified
-- directly, so anything of our own about a user lives here.
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  currency    text not null default 'EUR',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. ENTRIES
-- Every income, business cost and home cost.
--
-- Two decisions worth understanding:
--
-- * id is a uuid generated on the PHONE, not by the database.
--   The app must work with no signal, so an entry gets its
--   identity the moment it is created and keeps it when it
--   syncs. A database-generated id would mean the phone had
--   nothing to reference until it reached the network.
--
-- * deletes are "soft": deleted_at is set rather than the row
--   being removed. If the row simply vanished, a phone that was
--   offline during the delete would re-upload it on its next
--   sync and the entry would come back from the dead.
-- ------------------------------------------------------------
create table if not exists public.entries (
  id           uuid primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  type         text not null check (type in ('income','business','personal')),
  category     text not null,
  amount       numeric(12,2) not null check (amount > 0),
  pay_method   text,
  note         text,
  occurred_at  timestamptz not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz
);

create index if not exists entries_user_time_idx
  on public.entries (user_id, occurred_at desc);
create index if not exists entries_user_updated_idx
  on public.entries (user_id, updated_at desc);

-- ------------------------------------------------------------
-- 3. SETTINGS
-- Targets and preferences, one row per user.
-- ------------------------------------------------------------
create table if not exists public.settings (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  target_day    numeric(12,2) not null default 200,
  target_week   numeric(12,2) not null default 1200,
  target_month  numeric(12,2) not null default 4800,
  skin          text not null default 'night',
  updated_at    timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- Without this, anyone holding the public anon key could read
-- every user's income. These policies make the database itself
-- enforce that a user only ever touches their own rows — it is
-- not something the app is trusted to get right.
-- ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.entries  enable row level security;
alter table public.settings enable row level security;

drop policy if exists "own profile"  on public.profiles;
drop policy if exists "own entries"  on public.entries;
drop policy if exists "own settings" on public.settings;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. NEW USER SETUP
-- Creates the profile and settings rows the instant someone
-- signs up, so the app never has to handle a half-built account.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;

  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 6. TOUCH updated_at
-- Sync compares timestamps to decide which copy of an entry is
-- newer, so updated_at must be maintained by the database
-- rather than trusted from the phone (whose clock may be wrong).
-- ------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Done. Check Table Editor: profiles, entries and settings
-- should be listed, each showing "RLS enabled".
-- ============================================================
