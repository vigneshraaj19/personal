-- ══════════════════════════════════════════════════════════════════
-- Auth, Roles & Teams migration
-- Run this in your Supabase project's SQL Editor (Dashboard → SQL Editor → New query)
-- ══════════════════════════════════════════════════════════════════

-- ── Teams ─────────────────────────────────────────────────────────
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#4f46e5',
  created_at timestamptz not null default now()
);

-- ── Profiles (one row per auth.users row) ────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_initials text,
  role text not null default 'member' check (role in ('admin', 'member')),
  team_id uuid references teams(id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── Auto-create a profile whenever someone signs up ──────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_initials, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.email), 2)),
    -- first user ever created becomes admin automatically; everyone after is 'member'
    case when (select count(*) from public.profiles) = 0 then 'admin' else 'member' end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Row Level Security ────────────────────────────────────────────
alter table teams enable row level security;
alter table profiles enable row level security;

-- Everyone signed in can read teams / profiles (needed for chat, assignee pickers, etc.)
create policy "teams are readable by authenticated users"
  on teams for select
  to authenticated
  using (true);

create policy "profiles are readable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

-- Only admins can create/update/delete teams
create policy "admins manage teams"
  on teams for all
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Users can update their own profile (name/avatar); only admins can change role/team for others
create policy "users update own profile"
  on profiles for update
  to authenticated
  using (id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (id = auth.uid() or exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ══════════════════════════════════════════════════════════════════
-- Notes:
-- 1. The FIRST person who signs up becomes 'admin' automatically.
--    Everyone else becomes 'member'. You can promote more admins later
--    from the Admin Dashboard, or manually:
--    update profiles set role = 'admin' where email = 'someone@example.com';
-- 2. In Supabase Dashboard → Authentication → Providers, make sure
--    "Email" provider is enabled. For quick testing you can disable
--    "Confirm email" under Authentication → Settings.
-- ══════════════════════════════════════════════════════════════════
