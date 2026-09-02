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
