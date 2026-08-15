/*
# Create work tracker schema (single-tenant, no auth)

A Jira-like work tracker with projects, issues, and comments.
This is a single-tenant demo app with no sign-in screen, so all
policies allow anon + authenticated access (data is intentionally shared).

## 1. New Tables

### `projects`
- `id` (uuid, PK)
- `key` (text, not null, unique) — short project key like "ENG"
- `name` (text, not null)
- `description` (text, nullable)
- `icon` (text, nullable) — emoji or lucide icon name for the project
- `color` (text, nullable) — hex color for project branding
- `created_at` (timestamptz, default now())

### `issues`
- `id` (uuid, PK)
- `project_id` (uuid, FK → projects.id ON DELETE CASCADE, not null)
- `key` (text, not null, unique) — display key like "ENG-12"
- `summary` (text, not null)
- `description` (text, nullable)
- `status` (text, not null, default 'backlog') — backlog | todo | in_progress | in_review | done
- `type` (text, not null, default 'task') — task | bug | story | epic
- `priority` (text, not null, default 'medium') — lowest | low | medium | high | highest
- `assignee_name` (text, nullable) — name of the person assigned
- `assignee_avatar` (text, nullable) — initials or avatar URL
- `reporter_name` (text, nullable)
- `labels` (text[], nullable) — array of label strings
- `story_points` (integer, nullable)
- `due_date` (date, nullable)
- `rank` (integer, not null, default 0) — for manual ordering within a status column
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### `comments`
- `id` (uuid, PK)
- `issue_id` (uuid, FK → issues.id ON DELETE CASCADE, not null)
- `author_name` (text, not null)
- `author_avatar` (text, nullable)
- `body` (text, not null)
- `created_at` (timestamptz, default now())

## 2. Indexes
- `issues.project_id` — filtered on every board load
- `issues.status` — grouped for column rendering
- `issues.key` (unique) — lookups and display
- `comments.issue_id` — loaded per issue detail

## 3. Security (RLS)
All tables are single-tenant / no-auth. Every table enables RLS and
allows full CRUD for `anon, authenticated` because the data is
intentionally shared across all users of this demo app.

## 4. Seed Data
Two projects ("Atlas" platform, "Nebula" mobile) with realistic issues
across all statuses and types, plus comments on a few issues.
Issue inserts use subqueries to resolve the project_id from the project key.
*/

-- ── projects ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- ── issues ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key text NOT NULL UNIQUE,
  summary text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'backlog',
  type text NOT NULL DEFAULT 'task',
  priority text NOT NULL DEFAULT 'medium',
  assignee_name text,
  assignee_avatar text,
  reporter_name text,
  labels text[],
  story_points integer,
  due_date date,
  rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_issues" ON issues;
CREATE POLICY "anon_select_issues" ON issues FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_issues" ON issues;
CREATE POLICY "anon_insert_issues" ON issues FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_issues" ON issues;
CREATE POLICY "anon_update_issues" ON issues FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_issues" ON issues;
CREATE POLICY "anon_delete_issues" ON issues FOR DELETE
  TO anon, authenticated USING (true);

-- ── comments ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_avatar text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_comments" ON comments;
CREATE POLICY "anon_select_comments" ON comments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_comments" ON comments;
CREATE POLICY "anon_insert_comments" ON comments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_comments" ON comments;
CREATE POLICY "anon_delete_comments" ON comments FOR DELETE
  TO anon, authenticated USING (true);

-- ── Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);

-- ── Updated-at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS issues_set_updated_at ON issues;
CREATE TRIGGER issues_set_updated_at
  BEFORE UPDATE ON issues
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- ── Seed: projects ────────────────────────────────────────
INSERT INTO projects (key, name, description, icon, color) VALUES
  ('ATL', 'Atlas Platform', 'Core web platform and infrastructure powering all customer-facing services.', 'layers', '#4f46e5'),
  ('NEB', 'Nebula Mobile', 'Cross-platform mobile app for iOS and Android — offline-first sync.', 'rocket', '#0d9488')
ON CONFLICT (key) DO NOTHING;

-- ── Seed: issues (Atlas) ──────────────────────────────────
INSERT INTO issues (project_id, key, summary, description, status, type, priority, assignee_name, assignee_avatar, reporter_name, labels, story_points, due_date, rank)
SELECT p.id, t.iss_key, t.summary, t.description, t.status, t.type, t.priority, t.assignee_name, t.assignee_avatar, t.reporter_name, t.labels, t.story_points, t.due_date, t.rank
FROM (VALUES
  ('ATL', 'ATL-1', 'Implement OAuth2 login flow', 'Add Google and GitHub OAuth providers using Supabase Auth. Include session refresh handling and redirect after login.', 'in_progress', 'story', 'high', 'Maya Chen', 'MC', 'Sarah Lopez', ARRAY['auth', 'frontend'], 8, '2026-08-01'::date, 0),
  ('ATL', 'ATL-2', 'Fix race condition in cart checkout', 'Two concurrent requests can double-charge when the same cart is submitted from two tabs. Add a pessimistic lock on the cart row.', 'in_review', 'bug', 'highest', 'James Park', 'JP', 'Maya Chen', ARRAY['checkout', 'critical'], 5, '2026-07-25'::date, 0),
  ('ATL', 'ATL-3', 'Design system: add toast notifications', 'Create a reusable Toast component with variants (success, error, warning, info). Auto-dismiss after 4s, manual close button.', 'todo', 'task', 'medium', 'Priya Nair', 'PN', 'Sarah Lopez', ARRAY['design-system', 'frontend'], 3, '2026-08-10'::date, 0),
  ('ATL', 'ATL-4', 'Add analytics dashboard with charts', 'Build a dashboard showing active users, revenue, and churn over time. Use Recharts. Add date-range filter.', 'todo', 'story', 'medium', NULL, NULL, 'James Park', ARRAY['analytics', 'frontend'], 13, '2026-09-01'::date, 1),
  ('ATL', 'ATL-5', 'Refactor API middleware stack', 'The current middleware chain is hard to test. Extract into composable handlers with explicit error boundaries.', 'backlog', 'task', 'low', NULL, NULL, 'Maya Chen', ARRAY['backend', 'tech-debt'], 5, NULL::date, 0),
  ('ATL', 'ATL-6', 'Set up CI/CD pipeline with GitHub Actions', 'Automate build, test, and deploy on push to main. Include preview deployments for PRs.', 'done', 'task', 'medium', 'James Park', 'JP', 'Sarah Lopez', ARRAY['devops', 'ci'], 3, '2026-07-15'::date, 0),
  ('ATL', 'ATL-7', 'Improve search performance with index tuning', 'Product search is slow at >100k items. Add GIN index on tags and materialized view for popular queries.', 'in_progress', 'task', 'high', 'Maya Chen', 'MC', 'James Park', ARRAY['backend', 'performance'], 8, '2026-08-05'::date, 1),
  ('ATL', 'ATL-8', 'Add dark mode theme support', 'Users have been requesting dark mode. Add a theme toggle in settings and persist preference in localStorage.', 'backlog', 'story', 'low', 'Priya Nair', 'PN', 'Sarah Lopez', ARRAY['frontend', 'design'], 5, NULL::date, 1),
  ('ATL', 'ATL-9', 'Fix email notifications going to spam', 'Emails are being flagged by Gmail. Fix SPF/DKIM records and switch to a dedicated IP.', 'done', 'bug', 'high', 'Sarah Lopez', 'SL', 'Maya Chen', ARRAY['email', 'infra'], 2, '2026-07-10'::date, 1),
  ('ATL', 'ATL-10', 'Add role-based access control', 'Implement RBAC with admin, editor, and viewer roles. Add permission checks on API routes and UI elements.', 'backlog', 'epic', 'high', NULL, NULL, 'Sarah Lopez', ARRAY['auth', 'backend'], 21, NULL::date, 2)
) AS t(proj_key, iss_key, summary, description, status, type, priority, assignee_name, assignee_avatar, reporter_name, labels, story_points, due_date, rank)
JOIN projects p ON p.key = t.proj_key
ON CONFLICT (key) DO NOTHING;

-- ── Seed: issues (Nebula) ─────────────────────────────────
INSERT INTO issues (project_id, key, summary, description, status, type, priority, assignee_name, assignee_avatar, reporter_name, labels, story_points, due_date, rank)
SELECT p.id, t.iss_key, t.summary, t.description, t.status, t.type, t.priority, t.assignee_name, t.assignee_avatar, t.reporter_name, t.labels, t.story_points, t.due_date, t.rank
FROM (VALUES
  ('NEB', 'NEB-1', 'Offline sync engine for tasks', 'Build a sync layer that queues mutations when offline and replays them when connectivity returns. Handle conflict resolution with last-write-wins.', 'in_progress', 'story', 'high', 'Alex Rivera', 'AR', 'Maya Chen', ARRAY['mobile', 'offline'], 13, '2026-08-15'::date, 0),
  ('NEB', 'NEB-2', 'Crash on startup when push token is missing', 'App crashes on cold start if push notification permission was never granted. Guard against nil token.', 'in_review', 'bug', 'highest', 'Tom Becker', 'TB', 'Alex Rivera', ARRAY['mobile', 'crash'], 2, '2026-07-24'::date, 1),
  ('NEB', 'NEB-3', 'Add biometric authentication (Face ID / fingerprint)', 'Allow users to enable Face ID / fingerprint unlock. Fall back to PIN if biometrics unavailable.', 'todo', 'story', 'medium', 'Alex Rivera', 'AR', 'Sarah Lopez', ARRAY['mobile', 'auth'], 8, '2026-08-20'::date, 0),
  ('NEB', 'NEB-4', 'Redesign onboarding flow', 'Current 5-step onboarding has 40% drop-off. Condense to 3 steps with progressive disclosure.', 'todo', 'story', 'medium', 'Priya Nair', 'PN', 'Maya Chen', ARRAY['mobile', 'design'], 5, '2026-08-30'::date, 1),
  ('NEB', 'NEB-5', 'Add push notification preferences', 'Let users choose which notification types they receive: mentions, assignments, deadlines.', 'backlog', 'task', 'low', NULL, NULL, 'Alex Rivera', ARRAY['mobile', 'notifications'], 3, NULL::date, 0),
  ('NEB', 'NEB-6', 'Fix memory leak in image gallery', 'Images are not being released from memory after scrolling. Use recycling pool for image cells.', 'done', 'bug', 'high', 'Tom Becker', 'TB', 'Alex Rivera', ARRAY['mobile', 'performance'], 3, '2026-07-12'::date, 2),
  ('NEB', 'NEB-7', 'Add widget for home screen quick actions', 'iOS and Android home screen widgets showing task count and quick-add button.', 'backlog', 'story', 'low', NULL, NULL, 'Sarah Lopez', ARRAY['mobile', 'widgets'], 8, NULL::date, 1),
  ('NEB', 'NEB-8', 'Localization for 5 languages', 'Add i18n support for English, Spanish, French, German, and Japanese. Extract all user-facing strings.', 'in_progress', 'task', 'medium', 'Priya Nair', 'PN', 'Maya Chen', ARRAY['mobile', 'i18n'], 5, '2026-09-10'::date, 2)
) AS t(proj_key, iss_key, summary, description, status, type, priority, assignee_name, assignee_avatar, reporter_name, labels, story_points, due_date, rank)
JOIN projects p ON p.key = t.proj_key
ON CONFLICT (key) DO NOTHING;

-- ── Seed: comments ────────────────────────────────────────
INSERT INTO comments (issue_id, author_name, author_avatar, body)
SELECT i.id, t.author_name, t.author_avatar, t.body
FROM (VALUES
  ('ATL-1', 'Sarah Lopez', 'SL', 'Can we also support Microsoft accounts? Some enterprise clients need it.'),
  ('ATL-1', 'Maya Chen', 'MC', 'Good point. I''ll add it as a follow-up story rather than scope-creeping this one.'),
  ('ATL-2', 'James Park', 'JP', 'I''ve got a fix using SELECT ... FOR UPDATE on the cart row. Testing it now.'),
  ('ATL-2', 'Maya Chen', 'MC', 'Nice. Make sure to add a test that simulates two concurrent requests.'),
  ('NEB-1', 'Alex Rivera', 'AR', 'Conflict resolution is trickier than I thought. Considering CRDTs for the next iteration.'),
  ('NEB-2', 'Tom Becker', 'TB', 'Reproduced on iOS 17.2. The token unwrap force-crashes. Fix incoming.')
) AS t(issue_key, author_name, author_avatar, body)
JOIN issues i ON i.key = t.issue_key
ON CONFLICT DO NOTHING;
