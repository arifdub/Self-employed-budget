-- v1.1.0 — custom categories
-- Run once in Supabase → SQL Editor.
--
-- Categories are stored as JSON on the settings row rather than in their own
-- table. They are only ever read and written as a complete set for one user,
-- never queried across users, so a table would add joins and migrations for no
-- benefit. If categories ever need reporting on across accounts, that is the
-- point to normalise them.

alter table public.settings
  add column if not exists categories jsonb;
