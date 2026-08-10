-- Heartbeat table for the keep-alive workflow.
-- Run this once in Supabase → SQL Editor.
--
-- The workflow needs something it can legitimately read with the public anon key.
-- Pointing it at a real table means the ping exercises the database rather than
-- just the API gateway. The table holds one meaningless row and no user data.

create table if not exists public.heartbeat (
  id  int primary key default 1,
  ok  boolean not null default true
);

insert into public.heartbeat (id) values (1) on conflict (id) do nothing;

alter table public.heartbeat enable row level security;

drop policy if exists "heartbeat readable" on public.heartbeat;
create policy "heartbeat readable" on public.heartbeat
  for select using (true);          -- readable by anyone, contains nothing private
