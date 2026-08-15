export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done';
export type IssueType = 'task' | 'bug' | 'story' | 'epic';
export type IssuePriority = 'lowest' | 'low' | 'medium' | 'high' | 'highest';
export type UserRole = 'admin' | 'member';

export interface Team {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_initials: string | null;
  role: UserRole;
  team_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Issue {
  id: string;
  project_id: string;
  key: string;
  summary: string;
  description: string | null;
  status: IssueStatus;
  type: IssueType;
  priority: IssuePriority;
  assignee_name: string | null;
  assignee_avatar: string | null;
  reporter_name: string | null;
  labels: string[] | null;
  story_points: number | null;
  due_date: string | null;
  rank: integer;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string;
  created_at: string;
}

// ── Chat ──────────────────────────────────────────────────────────
export type ChannelType = 'team' | 'project' | 'group' | 'dm';

export interface Channel {
  id: string;
  type: ChannelType;
  name: string;
  project_id: string | null;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  channel_id: string;
  author_id: string | null;
  body: string;
  parent_message_id: string | null;
  pinned: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

// ── Notifications ─────────────────────────────────────────────────
export type NotificationType = 'mention' | 'assignment' | 'comment';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  channel_id: string | null;
  issue_id: string | null;
  read: boolean;
  created_at: string;
}

// Minimal numeric alias so tsc accepts the DB int type
type integer = number;
