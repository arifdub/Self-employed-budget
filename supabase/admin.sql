-- SE Budget — admin access
-- Run once in Supabase → SQL Editor.
--
-- Entries are protected by row-level security so nobody can read anyone else's
-- income. That protection must hold for the app owner too — the admin page
-- therefore never queries the tables directly from the browser. It calls an edge
-- function which checks the caller is an admin, and only ever returns aggregate
-- counts, never anyone's actual figures.

create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  added_at   timestamptz not null default now()
);

alter table public.admins enable row level security;

-- Readable only by the admin themselves. The edge function uses the service
-- role, which bypasses RLS by design.
drop policy if exists "own admin row" on public.admins;
create policy "own admin row" on public.admins
  for select using (auth.uid() = user_id);

-- Make yourself an admin: copy your UID from Authentication → Users.
-- insert into public.admins (user_id) values ('YOUR-UID-HERE');


-- Anonymous page-view counter, so the admin dashboard can show how many
-- people land on the site and which page they land on. No personal data is
-- stored: just the page path, a random id the visitor's own browser makes up
-- for itself (not tied to any account, email or entry), and a timestamp.

create table if not exists public.page_views (
  id          bigint generated always as identity primary key,
  path        text not null,
  visitor_id  text not null,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_created_at_idx on public.page_views (created_at);
create index if not exists page_views_path_idx on public.page_views (path);

alter table public.page_views enable row level security;

-- Anyone, including a signed-out visitor, can record a view — but nobody can
-- read them back through the browser. Only the admin-stats edge function can,
-- using the service role key, which bypasses row-level security by design.
drop policy if exists "anyone can log a page view" on public.page_views;
create policy "anyone can log a page view" on public.page_views
  for insert with check (true);
