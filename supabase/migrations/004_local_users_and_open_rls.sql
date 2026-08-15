-- ══════════════════════════════════════════════════════════════════
-- Switch from Supabase Auth to a plain `users` table
-- Run this in Supabase Dashboard → SQL Editor, after 001/002/003.
--
-- What changes and why:
--   1. Users now live in an ordinary `users` table (like projects/
--      issues/comments do) instead of Supabase's auth.users, with
--      the app checking email+password directly. No more signup
--      emails, no more auth.uid().
--   2. Because there's no Supabase Auth session anymore, `auth.uid()`
--      is always null and the old "to authenticated" policies would
--      block every request — including project creation. Policies
--      below are opened to everyone using the anon key instead.
--
-- ⚠️ This intentionally trades away security for simplicity: passwords
-- are stored as plain text and anyone with the anon key can read the
-- whole `users` table (which is exactly the DB-level risk of opening
-- these policies). Fine for an internal/trusted tool, not for a
-- public-facing product.
--
-- The old `profiles` table and its auth.users trigger are left in
-- place untouched (in case you want anything from them) but the app
-- no longer reads or writes either one. Drop them yourself later if
-- you don't need them:
--   drop trigger if exists on_auth_user_created on auth.users;
--   drop function if exists public.handle_new_user;
--   drop table if exists profiles;
-- ══════════════════════════════════════════════════════════════════

-- ── Users ─────────────────────────────────────────────────────────
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password text not null,
  full_name text,
  avatar_initials text,
  role text not null default 'member' check (role in ('admin', 'member')),
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table users enable row level security;

drop policy if exists "open access" on users;
create policy "open access" on users
  for all to public using (true) with check (true);

-- ── Re-open teams / projects / issues / comments to the anon key ──
-- (These previously said "to authenticated", which required a real
-- Supabase Auth session — something we no longer create.)

drop policy if exists "teams are readable by authenticated users" on teams;
drop policy if exists "admins manage teams" on teams;
drop policy if exists "open access" on teams;
create policy "open access" on teams
  for all to public using (true) with check (true);

drop policy if exists "authenticated full access" on projects;
drop policy if exists "open access" on projects;
create policy "open access" on projects
  for all to public using (true) with check (true);

drop policy if exists "authenticated full access" on issues;
drop policy if exists "open access" on issues;
create policy "open access" on issues
  for all to public using (true) with check (true);

drop policy if exists "authenticated full access" on comments;
drop policy if exists "open access" on comments;
create policy "open access" on comments
  for all to public using (true) with check (true);

-- ══════════════════════════════════════════════════════════════════
-- Notes:
-- 1. The first person who signs up (via the app, not this SQL)
--    becomes 'admin' automatically; everyone after is 'member'.
--    You can promote more admins later from the Admin Dashboard, or
--    manually:
--    update users set role = 'admin' where email = 'someone@example.com';
-- 2. There is no email confirmation step anymore — accounts are
--    usable immediately after signup/creation.
-- ══════════════════════════════════════════════════════════════════
