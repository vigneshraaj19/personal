import { useCallback, useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  Box,
  Typography,
  Button,
  Divider,
} from '@mui/material';
import { iconFor } from '@/lib/icons';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeToNotifications,
} from '@/lib/notifications-api';
import type { AppNotification } from '@/lib/types';

const TYPE_LABEL: Record<AppNotification['type'], string> = {
  mention: 'Mention',
  assignment: 'Assignment',
  comment: 'Comment',
};

const TYPE_COLOR: Record<AppNotification['type'], string> = {
  mention: '#4f46e5',
  assignment: '#0891b2',
  comment: '#d97706',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const BellIcon = iconFor('Bell');
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [list, count] = await Promise.all([fetchNotifications(userId), fetchUnreadCount(userId)]);
      setNotifications(list);
      setUnreadCount(count);
    } catch {
      // silently ignore — the bell just stays at its last known state
    }
  }, [userId]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToNotifications(userId, (n) => {
      setNotifications((prev) => [n, ...prev].slice(0, 50));
      setUnreadCount((prev) => prev + 1);
    });
    return unsubscribe;
  }, [userId, load]);

  async function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchor(e.currentTarget);
  }

  async function handleNotificationClick(n: AppNotification) {
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try {
        await markNotificationRead(n.id);
      } catch {
        load();
      }
    }
  }

  async function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(userId);
    } catch {
      load();
    }
  }

  return (
    <>
      <IconButton onClick={handleOpen} sx={{ color: '#64748b' }}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          overlap="circular"
          invisible={unreadCount === 0}
          slotProps={{ badge: { style: { fontSize: '0.6rem', height: 16, minWidth: 16 } } }}
        >
          <BellIcon size={19} />
        </Badge>
      </IconButton>

      <Menu
        open={!!anchor}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 2, mt: 1, width: 340, maxHeight: 440 } } }}
      >
        <Box sx={{ px: 2, py: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Notifications</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead} sx={{ fontSize: '0.72rem', textTransform: 'none' }}>
              Mark all read
            </Button>
          )}
        </Box>
        <Divider />
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8' }}>You're all caught up.</Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.map((n) => (
              <Box
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                sx={{
                  px: 2,
                  py: 1.25,
                  cursor: 'pointer',
                  borderBottom: '1px solid #f1f5f9',
                  bgcolor: n.read ? 'transparent' : '#eef2ff',
                  '&:hover': { bgcolor: '#f8fafc' },
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.25 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: TYPE_COLOR[n.type],
                      flexShrink: 0,
                    }}
                  />
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: TYPE_COLOR[n.type], textTransform: 'uppercase' }}>
                    {TYPE_LABEL[n.type]}
                  </Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8', ml: 'auto' }}>{timeAgo(n.created_at)}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.3 }}>{n.title}</Typography>
                {n.body && (
                  <Typography sx={{ fontSize: '0.76rem', color: '#64748b', mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {n.body}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Menu>
    </>
  );
}
