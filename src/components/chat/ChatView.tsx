import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import { iconFor } from '@/lib/icons';
import { AssigneeAvatar } from '@/components/ui/Badges';
import type { Channel, ChatMessage, Profile } from '@/lib/types';
import { fetchAllProfiles } from '@/lib/auth-api';
import {
  fetchChannels,
  fetchAllChannelMembers,
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  createGroupChannel,
  getOrCreateDmChannel,
  subscribeToChannelMessages,
} from '@/lib/chat-api';

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Lightly highlight @mentions in a message body — no rich picker, just visual affordance.
function renderBody(body: string) {
  const parts = body.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <Box key={i} component="span" sx={{ color: '#4f46e5', fontWeight: 600 }}>
        {part}
      </Box>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function ChatView({ currentUser, onBack }: { currentUser: Profile; onBack: () => void }) {
  const HashIcon = iconFor('Hash');
  const UsersIcon = iconFor('Users');
  const PlusIcon = iconFor('Plus');
  const SearchIcon = iconFor('Search');
  const SendIcon = iconFor('Send');
  const PinIcon = iconFor('Pin');
  const PinOffIcon = iconFor('PinOff');
  const ReplyIcon = iconFor('CornerUpLeft');
  const PencilIcon = iconFor('Pencil');
  const TrashIcon = iconFor('Trash2');
  const XIcon = iconFor('X');
  const ArrowLeft = iconFor('ChevronRight');

  const [channels, setChannels] = useState<Channel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberMap, setMemberMap] = useState<Map<string, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [messageInput, setMessageInput] = useState('');
  const [search, setSearch] = useState('');
  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [threadInput, setThreadInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState('');

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);
  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ch, profs, members] = await Promise.all([fetchChannels(), fetchAllProfiles(), fetchAllChannelMembers()]);
      setChannels(ch);
      setProfiles(profs);
      const map = new Map<string, Set<string>>();
      members.forEach((m) => {
        const set = map.get(m.channel_id) ?? new Set<string>();
        set.add(m.user_id);
        map.set(m.channel_id, set);
      });
      setMemberMap(map);
      setSelectedChannelId((prev) => prev ?? ch.find((c) => c.type === 'team')?.id ?? ch[0]?.id ?? null);
    } catch {
      setError('Failed to load chat.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      return;
    }
    let active = true;
    setMessagesLoading(true);
    const refresh = () => {
      fetchMessages(selectedChannelId)
        .then((m) => {
          if (active) setMessages(m);
        })
        .catch(() => {
          if (active) setError('Failed to load messages.');
        })
        .finally(() => {
          if (active) setMessagesLoading(false);
        });
    };
    refresh();
    const unsubscribe = subscribeToChannelMessages(selectedChannelId, refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [selectedChannelId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, threadRootId]);

  const profileById = useMemo(() => new Map(profiles.map((p) => [p.id, p])), [profiles]);

  function authorLabel(authorId: string | null): string {
    if (!authorId) return 'Unknown';
    if (authorId === currentUser.id) return 'You';
    const p = profileById.get(authorId);
    return p?.full_name ?? p?.email ?? 'Unknown';
  }

  function displayName(c: Channel): string {
    if (c.type !== 'dm') return c.name;
    const members = memberMap.get(c.id);
    const otherId = members ? [...members].find((id) => id !== currentUser.id) : undefined;
    const other = otherId ? profileById.get(otherId) : undefined;
    return other?.full_name ?? other?.email ?? c.name;
  }

  const grouped = useMemo(() => {
    const g: Record<Channel['type'], Channel[]> = { team: [], project: [], group: [], dm: [] };
    channels.forEach((c) => g[c.type].push(c));
    return g;
  }, [channels]);

  const selectedChannel = channels.find((c) => c.id === selectedChannelId) ?? null;

  const rootMessages = useMemo(() => messages.filter((m) => !m.parent_message_id), [messages]);
  const filteredRootMessages = useMemo(() => {
    if (!search.trim()) return rootMessages;
    const q = search.toLowerCase();
    return rootMessages.filter((m) => m.body.toLowerCase().includes(q));
  }, [rootMessages, search]);
  const pinnedMessages = useMemo(() => messages.filter((m) => m.pinned && !m.deleted_at), [messages]);
  const repliesOf = useCallback((id: string) => messages.filter((m) => m.parent_message_id === id), [messages]);
  const threadRoot = threadRootId ? messages.find((m) => m.id === threadRootId) ?? null : null;
  const threadReplies = threadRootId ? repliesOf(threadRootId) : [];

  async function handleSend() {
    if (!messageInput.trim() || !selectedChannelId) return;
    const body = messageInput.trim();
    setMessageInput('');
    try {
      await sendMessage({
        channelId: selectedChannelId,
        authorId: currentUser.id,
        authorName: currentUser.full_name ?? currentUser.email,
        body,
      });
    } catch {
      setError('Failed to send message.');
    }
  }

  async function handleSendThreadReply() {
    if (!threadInput.trim() || !selectedChannelId || !threadRootId) return;
    const body = threadInput.trim();
    setThreadInput('');
    try {
      await sendMessage({
        channelId: selectedChannelId,
        authorId: currentUser.id,
        authorName: currentUser.full_name ?? currentUser.email,
        body,
        parentMessageId: threadRootId,
      });
    } catch {
      setError('Failed to send reply.');
    }
  }

  async function handleTogglePin(m: ChatMessage) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, pinned: !x.pinned } : x)));
    try {
      await togglePinMessage(m.id, !m.pinned);
    } catch {
      setError('Failed to update pin.');
    }
  }

  async function handleDelete(m: ChatMessage) {
    setMessages((prev) => prev.map((x) => (x.id === m.id ? { ...x, deleted_at: new Date().toISOString() } : x)));
    try {
      await deleteMessage(m.id);
    } catch {
      setError('Failed to delete message.');
    }
  }

  function startEdit(m: ChatMessage) {
    setEditingId(m.id);
    setEditingBody(m.body);
  }

  async function saveEdit() {
    if (!editingId) return;
    const id = editingId;
    const body = editingBody.trim();
    setEditingId(null);
    if (!body) return;
    setMessages((prev) => prev.map((x) => (x.id === id ? { ...x, body, edited_at: new Date().toISOString() } : x)));
    try {
      await editMessage(id, body);
    } catch {
      setError('Failed to save edit.');
    }
  }

  async function handleCreateGroup() {
    if (!groupName.trim()) return;
    try {
      const c = await createGroupChannel(groupName.trim(), groupMemberIds, currentUser.id);
      setGroupDialogOpen(false);
      setGroupName('');
      setGroupMemberIds([]);
      await load();
      setSelectedChannelId(c.id);
    } catch {
      setError('Failed to create group chat.');
    }
  }

  async function handleStartDm(other: Profile) {
    try {
      const c = await getOrCreateDmChannel(currentUser.id, other.id, other.full_name ?? other.email);
      setDmDialogOpen(false);
      await load();
      setSelectedChannelId(c.id);
    } catch {
      setError('Failed to open direct message.');
    }
  }

  function renderChannelRow(c: Channel) {
    const isActive = c.id === selectedChannelId;
    const Icon = c.type === 'dm' ? null : c.type === 'group' ? UsersIcon : HashIcon;
    const other = c.type === 'dm' ? profileById.get([...(memberMap.get(c.id) ?? [])].find((id) => id !== currentUser.id) ?? '') : null;
    return (
      <ListItemButton
        key={c.id}
        selected={isActive}
        onClick={() => {
          setSelectedChannelId(c.id);
          setThreadRootId(null);
          setSearch('');
        }}
        sx={{
          borderRadius: 1,
          mb: 0.25,
          py: 0.625,
          px: 1.25,
          '&.Mui-selected': { bgcolor: 'rgba(99,102,241,0.15)' },
          '&.Mui-selected:hover': { bgcolor: 'rgba(99,102,241,0.2)' },
        }}
      >
        {Icon ? (
          <Icon size={15} color={isActive ? '#818cf8' : '#94a3b8'} style={{ marginRight: 8, flexShrink: 0 }} />
        ) : (
          <Box sx={{ mr: 1, flexShrink: 0 }}>
            <AssigneeAvatar name={other?.full_name ?? other?.email ?? null} initials={other?.avatar_initials} size={20} />
          </Box>
        )}
        <ListItemText
          primary={displayName(c)}
          slotProps={{
            primary: {
              sx: {
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#c7d2fe' : '#cbd5e1',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
            },
          }}
        />
      </ListItemButton>
    );
  }

  function MessageRow({ m, inThread }: { m: ChatMessage; inThread?: boolean }) {
    const isMine = m.author_id === currentUser.id;
    const isEditing = editingId === m.id;
    const replyCount = inThread ? 0 : repliesOf(m.id).length;

    if (m.deleted_at) {
      return (
        <Box sx={{ display: 'flex', gap: 1.25, py: 0.75, px: 0.5 }}>
          <AssigneeAvatar name={authorLabel(m.author_id)} size={30} />
          <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', pt: 0.5 }}>
            Message deleted
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          py: 0.75,
          px: 0.5,
          borderRadius: 2,
          '&:hover': { bgcolor: '#f8fafc' },
          '&:hover .msg-actions': { opacity: 1 },
        }}
      >
        <AssigneeAvatar name={authorLabel(m.author_id)} size={30} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
            <Typography sx={{ fontSize: '0.82rem', fontWeight: 700 }}>{authorLabel(m.author_id)}</Typography>
            <Typography sx={{ fontSize: '0.68rem', color: '#94a3b8' }}>{timeLabel(m.created_at)}</Typography>
            {m.edited_at && <Typography sx={{ fontSize: '0.65rem', color: '#cbd5e1' }}>(edited)</Typography>}
            {m.pinned && <PinIcon size={11} color="#d97706" />}
          </Box>

          {isEditing ? (
            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
              <TextField
                size="small"
                fullWidth
                value={editingBody}
                onChange={(e) => setEditingBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  }
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
              />
              <Button size="small" onClick={saveEdit}>
                Save
              </Button>
              <Button size="small" onClick={() => setEditingId(null)} sx={{ color: '#64748b' }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Typography sx={{ fontSize: '0.85rem', color: '#334155', wordBreak: 'break-word' }}>
              {renderBody(m.body)}
            </Typography>
          )}

          {!inThread && replyCount > 0 && (
            <Button
              size="small"
              onClick={() => setThreadRootId(m.id)}
              sx={{ fontSize: '0.72rem', textTransform: 'none', color: '#4f46e5', mt: 0.25, p: 0, minWidth: 0 }}
            >
              {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
            </Button>
          )}
        </Box>

        {!isEditing && (
          <Box className="msg-actions" sx={{ opacity: 0, display: 'flex', gap: 0.25, alignSelf: 'flex-start' }}>
            {!inThread && (
              <Tooltip title="Reply in thread">
                <IconButton size="small" onClick={() => setThreadRootId(m.id)}>
                  <ReplyIcon size={14} color="#94a3b8" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title={m.pinned ? 'Unpin' : 'Pin'}>
              <IconButton size="small" onClick={() => handleTogglePin(m)}>
                {m.pinned ? <PinOffIcon size={14} color="#94a3b8" /> : <PinIcon size={14} color="#94a3b8" />}
              </IconButton>
            </Tooltip>
            {isMine && (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => startEdit(m)}>
                    <PencilIcon size={14} color="#94a3b8" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(m)}>
                    <TrashIcon size={14} color="#dc2626" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={26} sx={{ color: '#4f46e5' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', bgcolor: '#f8fafc' }}>
      {/* Channel list */}
      <Box sx={{ width: 260, flexShrink: 0, bgcolor: '#0f172a', color: '#cbd5e1', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 2 }}>
          <IconButton onClick={onBack} size="small" sx={{ transform: 'rotate(180deg)', color: '#64748b' }}>
            <ArrowLeft size={16} />
          </IconButton>
          <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#f8fafc' }}>Chat</Typography>
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5 }}>
          {grouped.team.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', px: 1.25, mt: 1, mb: 0.5 }}>
                Team
              </Typography>
              <List dense disablePadding>
                {grouped.team.map(renderChannelRow)}
              </List>
            </>
          )}

          {grouped.project.length > 0 && (
            <>
              <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', px: 1.25, mt: 1.5, mb: 0.5 }}>
                Projects
              </Typography>
              <List dense disablePadding>
                {grouped.project.map(renderChannelRow)}
              </List>
            </>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.25, mt: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Group chats
            </Typography>
            <Tooltip title="New group chat">
              <IconButton size="small" onClick={() => setGroupDialogOpen(true)} sx={{ color: '#64748b', p: 0.25 }}>
                <PlusIcon size={13} />
              </IconButton>
            </Tooltip>
          </Box>
          <List dense disablePadding>
            {grouped.group.map(renderChannelRow)}
          </List>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.25, mt: 1.5, mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              Direct messages
            </Typography>
            <Tooltip title="New direct message">
              <IconButton size="small" onClick={() => setDmDialogOpen(true)} sx={{ color: '#64748b', p: 0.25 }}>
                <PlusIcon size={13} />
              </IconButton>
            </Tooltip>
          </Box>
          <List dense disablePadding sx={{ pb: 2 }}>
            {grouped.dm.map(renderChannelRow)}
          </List>
        </Box>
      </Box>

      {/* Message area */}
      <Box sx={{ flex: 1, display: 'flex', minWidth: 0 }}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {!selectedChannel ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#94a3b8' }}>No channels yet.</Typography>
            </Box>
          ) : (
            <>
              {/* Header */}
              <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff', display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>{displayName(selectedChannel)}</Typography>
                <Paper
                  sx={{
                    ml: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    width: 200,
                    height: 30,
                    bgcolor: '#f1f5f9',
                    borderRadius: 2,
                    px: 1,
                    gap: 0.5,
                  }}
                  elevation={0}
                >
                  <SearchIcon size={14} color="#94a3b8" />
                  <InputBase
                    placeholder="Search messages..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{ fontSize: '0.76rem', flex: 1, input: { py: 0 } }}
                  />
                </Paper>
              </Box>

              {/* Pinned */}
              {pinnedMessages.length > 0 && (
                <Box sx={{ px: 2.5, py: 1, borderBottom: '1px solid #e2e8f0', bgcolor: '#fffbeb', display: 'flex', gap: 1, alignItems: 'center', overflowX: 'auto' }}>
                  <PinIcon size={13} color="#d97706" />
                  {pinnedMessages.map((m) => (
                    <Typography key={m.id} sx={{ fontSize: '0.75rem', color: '#92400e', whiteSpace: 'nowrap' }}>
                      {authorLabel(m.author_id)}: {m.body.slice(0, 60)}
                    </Typography>
                  ))}
                </Box>
              )}

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 2 }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={20} sx={{ color: '#4f46e5' }} />
                  </Box>
                ) : filteredRootMessages.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                      No messages yet. Say hello 👋
                    </Typography>
                  </Box>
                ) : (
                  filteredRootMessages.map((m) => <MessageRow key={m.id} m={m} />)
                )}
                <div ref={bottomRef} />
              </Box>

              {/* Composer */}
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid #e2e8f0', bgcolor: '#fff', display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Message... (use @name to mention someone)"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <IconButton onClick={handleSend} sx={{ bgcolor: '#4f46e5', color: '#fff', '&:hover': { bgcolor: '#4338ca' } }}>
                  <SendIcon size={16} />
                </IconButton>
              </Box>
            </>
          )}
        </Box>

        {/* Thread panel */}
        {threadRoot && (
          <Box sx={{ width: 340, flexShrink: 0, borderLeft: '1px solid #e2e8f0', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>Thread</Typography>
              <IconButton size="small" onClick={() => setThreadRootId(null)}>
                <XIcon size={15} />
              </IconButton>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 1.5, py: 1 }}>
              <MessageRow m={threadRoot} inThread />
              <Divider sx={{ my: 1 }} />
              {threadReplies.length === 0 ? (
                <Typography sx={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', py: 2 }}>
                  No replies yet.
                </Typography>
              ) : (
                threadReplies.map((m) => <MessageRow key={m.id} m={m} inThread />)
              )}
            </Box>
            <Box sx={{ px: 1.5, py: 1.25, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Reply..."
                value={threadInput}
                onChange={(e) => setThreadInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendThreadReply();
                  }
                }}
              />
              <IconButton onClick={handleSendThreadReply} sx={{ bgcolor: '#4f46e5', color: '#fff', '&:hover': { bgcolor: '#4338ca' } }}>
                <SendIcon size={16} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>

      {/* New group dialog */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>New group chat</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: 1 }}>
          <TextField label="Group name" size="small" fullWidth value={groupName} onChange={(e) => setGroupName(e.target.value)} />
          <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', mt: 0.5 }}>Members</Typography>
          <Box sx={{ maxHeight: 220, overflowY: 'auto' }}>
            {profiles
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <ListItemButton
                  key={p.id}
                  dense
                  onClick={() =>
                    setGroupMemberIds((prev) => (prev.includes(p.id) ? prev.filter((id) => id !== p.id) : [...prev, p.id]))
                  }
                >
                  <Checkbox size="small" checked={groupMemberIds.includes(p.id)} sx={{ p: 0.5, mr: 1 }} />
                  <ListItemText
                    primary={p.full_name ?? p.email}
                    slotProps={{ primary: { sx: { fontSize: '0.82rem' } } }}
                  />
                </ListItemButton>
              ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setGroupDialogOpen(false)} sx={{ color: '#64748b' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* New DM dialog */}
      <Dialog open={dmDialogOpen} onClose={() => setDmDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1rem' }}>Direct message</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <List dense>
            {profiles
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <ListItemButton key={p.id} onClick={() => handleStartDm(p)}>
                  <Box sx={{ mr: 1.25 }}>
                    <AssigneeAvatar name={p.full_name ?? p.email} initials={p.avatar_initials} size={26} />
                  </Box>
                  <ListItemText
                    primary={p.full_name ?? p.email}
                    secondary={p.email}
                    slotProps={{ primary: { sx: { fontSize: '0.82rem', fontWeight: 600 } }, secondary: { sx: { fontSize: '0.72rem' } } }}
                  />
                </ListItemButton>
              ))}
            {profiles.length <= 1 && (
              <Typography sx={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', py: 2 }}>
                No other users yet.
              </Typography>
            )}
          </List>
        </DialogContent>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
