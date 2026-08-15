import { supabase } from './supabase';
import type { AppNotification, NotificationType } from './types';

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false);
  if (error) throw error;
}

interface NotifyPayload {
  type: NotificationType;
  title: string;
  body?: string | null;
  channel_id?: string | null;
  issue_id?: string | null;
}

export async function notifyUsers(userIds: string[], payload: NotifyPayload): Promise<void> {
  const ids = Array.from(new Set(userIds)).filter(Boolean);
  if (!ids.length) return;
  const rows = ids.map((user_id) => ({
    user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body ?? null,
    channel_id: payload.channel_id ?? null,
    issue_id: payload.issue_id ?? null,
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw error;
}

/**
 * Best-effort match of a free-text name (e.g. an issue's assignee_name,
 * which isn't a real foreign key) to an actual user account, so
 * assignment/comment notifications can still reach someone.
 */
export async function notifyUserByName(fullName: string | null | undefined, payload: NotifyPayload): Promise<void> {
  if (!fullName?.trim()) return;
  const { data, error } = await supabase.from('users').select('id').ilike('full_name', fullName.trim());
  if (error) throw error;
  await notifyUsers((data ?? []).map((u) => u.id), payload);
}

export function subscribeToNotifications(userId: string, onInsert: (n: AppNotification) => void) {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as AppNotification)
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
