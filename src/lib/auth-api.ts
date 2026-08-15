import { supabase } from './supabase';
import type { Profile, Team, UserRole } from './types';

// Columns to read back — deliberately excludes `password` so it never
// sits around in app state / React devtools longer than the one
// query that checks it.
const PROFILE_COLUMNS = 'id,email,full_name,avatar_initials,role,team_id,created_at';

// ── Auth (plain `users` table — no Supabase Auth) ───────────────────
// Users are rows in an ordinary `users` table, checked directly from
// the browser. Simple, and consistent with how projects/issues/
// comments already work here — but note this is NOT secure for a
// real production app: passwords are stored as plain text, and
// anyone with the anon key can read the `users` table (RLS on it is
// wide open, same as the other tables). Fine for an internal/trusted
// tool only.

export async function signUp(email: string, password: string, fullName: string): Promise<Profile> {
  // First signup on a fresh project becomes admin; everyone after is 'member'.
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  if (countError) throw countError;

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      password,
      full_name: fullName,
      avatar_initials: fullName.slice(0, 2).toUpperCase(),
      role: (count ?? 0) === 0 ? 'admin' : 'member',
    })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('email', email)
    .eq('password', password)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Invalid email or password.');
  return data;
}

// There's no server session to close anymore — signing out just means
// forgetting the locally-stored user id. See auth-context's `logout()`.

// ── Admin-driven user creation ───────────────────────────────────────
// Inserts a new row directly into `users` — no Supabase Auth call,
// no confirmation email, usable immediately.
export async function adminCreateUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  teamId: string | null;
}): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
      avatar_initials: input.fullName.slice(0, 2).toUpperCase(),
      role: input.role,
      team_id: input.teamId,
    })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

// ── Profile ───────────────────────────────────────────────────────
export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchAllProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateProfile(id: string, patch: Partial<Profile>): Promise<Profile> {
  const { data, error } = await supabase
    .from('users')
    .update(patch)
    .eq('id', id)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data;
}

export async function setUserRole(id: string, role: UserRole): Promise<Profile> {
  return updateProfile(id, { role });
}

export async function setUserTeam(id: string, teamId: string | null): Promise<Profile> {
  return updateProfile(id, { team_id: teamId });
}

// ── Teams ─────────────────────────────────────────────────────────
export async function fetchTeams(): Promise<Team[]> {
  const { data, error } = await supabase.from('teams').select('*').order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createTeam(name: string, color?: string): Promise<Team> {
  const { data, error } = await supabase
    .from('teams')
    .insert({ name, color: color ?? '#4f46e5' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}
