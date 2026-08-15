-- ══════════════════════════════════════════════════════════════════
-- Projects / Issues / Comments — table + RLS fix
-- Run this in Supabase SQL Editor. Safe to run even if these tables
-- already exist — it will not touch existing rows.
--
-- Why this file exists: if you could not create a project, the most
-- likely cause is one of:
--   1. These tables don't actually exist in your Supabase project yet, or
--   2. They exist but have Row Level Security turned on with no
--      policies — which silently blocks every insert/select.
-- This migration fixes both.
-- ══════════════════════════════════════════════════════════════════

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now()
);

create table if not exists issues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  key text not null unique,
  summary text not null,
  description text,
  status text not null default 'backlog' check (status in ('backlog','todo','in_progress','in_review','done')),
  type text not null default 'task' check (type in ('task','bug','story','epic')),
  priority text not null default 'medium' check (priority in ('lowest','low','medium','high','highest')),
  assignee_name text,
  assignee_avatar text,
  reporter_name text,
  labels text[],
  story_points numeric,
  due_date date,
  rank integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references issues(id) on delete cascade,
  author_name text not null,
  author_avatar text,
  body text not null,
  created_at timestamptz not null default now()
);

-- Keep updated_at current on every issue edit
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_issues_updated_at on issues;
create trigger set_issues_updated_at
  before update on issues
  for each row execute procedure public.touch_updated_at();

-- ── Row Level Security ────────────────────────────────────────────
-- This is an internal team tool: any signed-in user can read/write
-- projects, issues, and comments. (Role-based restrictions, if you
-- want them later, would go here instead.)
alter table projects enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;

drop policy if exists "authenticated full access" on projects;
create policy "authenticated full access" on projects
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on issues;
create policy "authenticated full access" on issues
  for all to authenticated using (true) with check (true);

drop policy if exists "authenticated full access" on comments;
create policy "authenticated full access" on comments
  for all to authenticated using (true) with check (true);
