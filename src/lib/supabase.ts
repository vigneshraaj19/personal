import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Auth is no longer handled by Supabase Auth — users live in a plain
// `users` table (see supabase/migrations/004_local_users_and_open_rls.sql)
// and the app checks email/password directly. This is the only client
// needed now; the previous second "adminAuthClient" existed only to
// call supabase.auth.signUp() without disturbing the admin's own
// session, which is no longer relevant.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
