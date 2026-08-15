-- ══════════════════════════════════════════════════════════════════
-- RLS hard reset for projects / issues / comments
-- Run this if you're seeing:
--   "new row violates row-level security policy for table ..."
-- This means RLS is ON but no working policy is granting access —
-- often because 002 wasn't run yet, or an old/blocking policy
-- (e.g. auto-created by the Supabase Table Editor) already exists.
-- This script removes ALL existing policies on these 3 tables first,
-- so there's nothing left to conflict, then reapplies clean ones.
-- ══════════════════════════════════════════════════════════════════

-- 1. See what's currently there (optional — just informational)
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename in ('projects', 'issues', 'comments');

-- 2. Drop every existing policy on these tables, whatever they're called
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where tablename in ('projects', 'issues', 'comments')
  loop
    execute format('drop policy if exists %I on %I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 3. Make sure RLS is on, then add one clean, unambiguous policy per table
alter table projects enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;

create policy "authenticated full access" on projects
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on issues
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on comments
  for all to authenticated using (true) with check (true);

-- 4. Confirm — you should see exactly one policy per table now
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where tablename in ('projects', 'issues', 'comments');
