import type { IssueStatus, IssueType, IssuePriority } from './types';

export const STATUS_COLUMNS: { id: IssueStatus; label: string }[] = [
  { id: 'backlog', label: 'Backlog' },
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'done', label: 'Done' },
];

export const STATUS_META: Record<IssueStatus, { color: string; bg: string }> = {
  backlog: { color: '#64748b', bg: '#f1f5f9' },
  todo: { color: '#2563eb', bg: '#eff6ff' },
  in_progress: { color: '#d97706', bg: '#fffbeb' },
  in_review: { color: '#7c3aed', bg: '#f5f3ff' },
  done: { color: '#16a34a', bg: '#f0fdf4' },
};

export const TYPE_META: Record<IssueType, { label: string; color: string; icon: string }> = {
  task: { label: 'Task', color: '#3b82f6', icon: 'CheckSquare' },
  bug: { label: 'Bug', color: '#ef4444', icon: 'CircleDot' },
  story: { label: 'Story', color: '#22c55e', icon: 'Bookmark' },
  epic: { label: 'Epic', color: '#8b5cf6', icon: 'Mountain' },
};

export const PRIORITY_META: Record<IssuePriority, { label: string; color: string; icon: string }> = {
  lowest: { label: 'Lowest', color: '#64748b', icon: 'ArrowDown' },
  low: { label: 'Low', color: '#3b82f6', icon: 'ArrowDownNarrowWide' },
  medium: { label: 'Medium', color: '#d97706', icon: 'Equal' },
  high: { label: 'High', color: '#f97316', icon: 'ArrowUpWideNarrow' },
  highest: { label: 'Highest', color: '#dc2626', icon: 'ArrowUp' },
};

export const ALL_STATUSES: IssueStatus[] = STATUS_COLUMNS.map((c) => c.id);
export const ALL_TYPES: IssueType[] = ['task', 'bug', 'story', 'epic'];
export const ALL_PRIORITIES: IssuePriority[] = ['lowest', 'low', 'medium', 'high', 'highest'];

export const PROJECT_ICONS = ['layers', 'rocket', 'package', 'compass', 'cloud', 'terminal', 'box', 'globe', 'shield', 'cpu'];

export const PROJECT_COLORS = ['#4f46e5', '#0d9488', '#db2777', '#ea580c', '#2563eb', '#7c3aed', '#16a34a', '#dc2626'];
