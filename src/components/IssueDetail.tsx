import { Drawer, Box, Typography, IconButton, Chip, Divider, Button, TextField, Avatar, Tooltip, Paper, CircularProgress, MenuItem, Select, FormControl, InputLabel, Checkbox, ListItemText, OutlinedInput } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { iconFor } from '@/lib/icons';
import type { Issue, Comment, IssueStatus, IssueType, IssuePriority, Profile } from '@/lib/types';
import { STATUS_COLUMNS, TYPE_META, PRIORITY_META, STATUS_META } from '@/lib/constants';
import { TypeIcon, PriorityIcon, AssigneeAvatar } from './ui/Badges';
import { fetchComments, addComment, deleteComment, updateIssue, deleteIssue } from '@/lib/api';
import { fetchAllProfiles } from '@/lib/auth-api';

interface IssueDetailProps {
  issue: Issue | null;
  open: boolean;
  onClose: () => void;
  onIssueUpdated: (issue: Issue) => void;
  onIssueDeleted: (id: string) => void;
  currentUser?: Profile | null;
}

export default function IssueDetail({ issue, open, onClose, onIssueUpdated, onIssueDeleted, currentUser }: IssueDetailProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [teamMembers, setTeamMembers] = useState<Profile[]>([]);
  const [notifyIds, setNotifyIds] = useState<string[]>([]);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState('');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState('');

  const loadComments = useCallback(async (id: string) => {
    setLoadingComments(true);
    try {
      const c = await fetchComments(id);
      setComments(c);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  useEffect(() => {
    if (issue && open) {
      loadComments(issue.id);
      setDescDraft(issue.description ?? '');
      setSummaryDraft(issue.summary);
      setNotifyIds([]);
      fetchAllProfiles().then(setTeamMembers).catch(() => setTeamMembers([]));
    }
  }, [issue, open, loadComments]);

  if (!issue) return null;

  const XIcon = iconFor('X');
  const TrashIcon = iconFor('Trash2');
  const MessageIcon = iconFor('MessageCircle');
  const PencilIcon = iconFor('Pencil');
  const CalendarIcon = iconFor('Calendar');

  async function handleAddComment() {
    if (!issue || !commentBody.trim()) return;
    try {
      const c = await addComment({
        issue_id: issue.id,
        author_name: currentUser?.full_name ?? currentUser?.email ?? 'You',
        author_avatar: currentUser?.avatar_initials ?? 'YO',
        body: commentBody.trim(),
        notifyUserIds: notifyIds,
      });
      setComments((prev) => [...prev, c]);
      setCommentBody('');
      setNotifyIds([]);
    } catch {
      // ignore
    }
  }

  async function handleDeleteComment(id: string) {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch {
      // ignore
    }
  }

  async function handleSaveDesc() {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { description: descDraft || null });
      onIssueUpdated(updated);
      setEditingDesc(false);
    } catch {
      // ignore
    }
  }

  async function handleSaveSummary() {
    if (!issue || !summaryDraft.trim()) return;
    try {
      const updated = await updateIssue(issue.id, { summary: summaryDraft.trim() });
      onIssueUpdated(updated);
      setEditingSummary(false);
    } catch {
      // ignore
    }
  }

  async function handleFieldChange(field: keyof Issue, value: string | number | null) {
    if (!issue) return;
    try {
      const updated = await updateIssue(issue.id, { [field]: value } as Partial<Issue>);
      onIssueUpdated(updated);
    } catch {
      // ignore
    }
  }

  async function handleDelete() {
    if (!issue) return;
    try {
      await deleteIssue(issue.id);
      onIssueDeleted(issue.id);
      onClose();
    } catch {
      // ignore
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 520, md: 580 }, p: 0 } } }}
    >
      {/* Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, bgcolor: '#fff', zIndex: 2 }}>
        <TypeIcon type={issue.type} size={18} />
        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{issue.key}</Typography>
        <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
          <Tooltip title="Delete issue">
            <IconButton onClick={handleDelete} sx={{ color: '#94a3b8', '&:hover': { color: '#dc2626', bgcolor: '#fef2f2' } }}>
              <TrashIcon size={18} />
            </IconButton>
          </Tooltip>
          <IconButton onClick={onClose} sx={{ color: '#64748b' }}>
            <XIcon size={20} />
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2.5, overflowY: 'auto', height: 'calc(100% - 64px)' }}>
        {/* Summary */}
        {editingSummary ? (
          <Box>
            <TextField
              fullWidth
              multiline
              value={summaryDraft}
              onChange={(e) => setSummaryDraft(e.target.value)}
              autoFocus
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleSaveSummary} sx={{ bgcolor: '#4f46e5' }}>Save</Button>
              <Button size="small" onClick={() => { setEditingSummary(false); setSummaryDraft(issue.summary); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Box
            onClick={() => setEditingSummary(true)}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 1, p: 0.5, mx: -0.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}
          >
            <Typography sx={{ fontSize: '1.15rem', fontWeight: 600, color: '#0f172a', lineHeight: 1.3, flex: 1 }}>
              {issue.summary}
            </Typography>
            <PencilIcon size={15} color="#cbd5e1" />
          </Box>
        )}

        {/* Metadata grid */}
        <Paper elevation={0} sx={{ mt: 2.5, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            {/* Status */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Status</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={issue.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as IssueStatus)}
                  sx={{ fontSize: '0.8rem', bgcolor: '#fff', height: 34 }}
                >
                  {STATUS_COLUMNS.map((c) => (
                    <MenuItem key={c.id} value={c.id} sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: STATUS_META[c.id].color }} />
                        {c.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Priority */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Priority</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={issue.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as IssuePriority)}
                  sx={{ fontSize: '0.8rem', bgcolor: '#fff', height: 34 }}
                >
                  {Object.entries(PRIORITY_META).map(([key, meta]) => (
                    <MenuItem key={key} value={key} sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PriorityIcon priority={key as IssuePriority} size={14} />
                        {meta.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Type */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Type</Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={issue.type}
                  onChange={(e) => handleFieldChange('type', e.target.value as IssueType)}
                  sx={{ fontSize: '0.8rem', bgcolor: '#fff', height: 34 }}
                >
                  {Object.entries(TYPE_META).map(([key, meta]) => (
                    <MenuItem key={key} value={key} sx={{ fontSize: '0.8rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TypeIcon type={key as IssueType} size={14} />
                        {meta.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Story points */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Story Points</Typography>
              <TextField
                fullWidth
                size="small"
                type="number"
                value={issue.story_points ?? ''}
                onChange={(e) => handleFieldChange('story_points', e.target.value ? parseInt(e.target.value, 10) : null)}
                sx={{ '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem', bgcolor: '#fff' } }}
              />
            </Box>

            {/* Assignee */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Assignee</Typography>
              <TextField
                fullWidth
                size="small"
                value={issue.assignee_name ?? ''}
                placeholder="Unassigned"
                onChange={(e) => handleFieldChange('assignee_name', e.target.value || null)}
                sx={{ '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem', bgcolor: '#fff' } }}
              />
            </Box>

            {/* Due date */}
            <Box>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', mb: 0.5 }}>Due Date</Typography>
              <TextField
                fullWidth
                size="small"
                type="date"
                value={issue.due_date ?? ''}
                onChange={(e) => handleFieldChange('due_date', e.target.value || null)}
                sx={{ '& .MuiInputBase-root': { height: 34, fontSize: '0.8rem', bgcolor: '#fff' } }}
              />
            </Box>
          </Box>
        </Paper>

        {/* Labels */}
        {issue.labels && issue.labels.length > 0 && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {issue.labels.map((label) => (
              <Chip key={label} label={label} size="small" sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 500, fontSize: '0.72rem' }} />
            ))}
          </Box>
        )}

        {/* Description */}
        <Divider sx={{ my: 2.5 }} />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</Typography>
        {editingDesc ? (
          <Box>
            <TextField
              fullWidth
              multiline
              minRows={4}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              autoFocus
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="contained" onClick={handleSaveDesc} sx={{ bgcolor: '#4f46e5' }}>Save</Button>
              <Button size="small" onClick={() => { setEditingDesc(false); setDescDraft(issue.description ?? ''); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Box
            onClick={() => setEditingDesc(true)}
            sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' }, borderRadius: 1, p: 1, mx: -1 }}
          >
            {issue.description ? (
              <Typography sx={{ fontSize: '0.825rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                {issue.description}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: '0.825rem', color: '#cbd5e1', fontStyle: 'italic' }}>Add a description...</Typography>
            )}
          </Box>
        )}

        {/* Comments */}
        <Divider sx={{ my: 2.5 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <MessageIcon size={16} color="#64748b" />
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Comments ({comments.length})
          </Typography>
        </Box>

        {loadingComments ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <CircularProgress size={20} sx={{ color: '#94a3b8' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {comments.map((c) => (
              <Box key={c.id} sx={{ display: 'flex', gap: 1.25, '&:hover .delete-comment': { opacity: 1 } }}>
                <AssigneeAvatar name={c.author_name} initials={c.author_avatar} size={30} />
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{c.author_name}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: '#94a3b8' }}>{timeAgo(c.created_at)}</Typography>
                    <IconButton
                      className="delete-comment"
                      onClick={() => handleDeleteComment(c.id)}
                      sx={{ ml: 'auto', p: 0.25, opacity: 0, transition: 'opacity 0.2s', color: '#94a3b8', '&:hover': { color: '#dc2626' } }}
                    >
                      <TrashIcon size={13} />
                    </IconButton>
                  </Box>
                  <Paper elevation={0} sx={{ mt: 0.5, p: 1.25, bgcolor: '#f8fafc', borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                    <Typography sx={{ fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>{c.body}</Typography>
                  </Paper>
                </Box>
              </Box>
            ))}
            {comments.length === 0 && !loadingComments && (
              <Typography sx={{ fontSize: '0.8rem', color: '#cbd5e1', fontStyle: 'italic', py: 1 }}>No comments yet. Start the conversation.</Typography>
            )}
          </Box>
        )}

        {/* Add comment */}
        <Box sx={{ mt: 2, display: 'flex', gap: 1.25 }}>
          <AssigneeAvatar
            name={currentUser?.full_name ?? currentUser?.email ?? 'You'}
            initials={currentUser?.avatar_initials ?? 'YO'}
            size={30}
          />
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Add a comment..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              sx={{ '& .MuiInputBase-root': { fontSize: '0.8rem' } }}
            />
            <FormControl size="small" fullWidth sx={{ mt: 1 }}>
              <InputLabel sx={{ fontSize: '0.8rem' }}>Notify</InputLabel>
              <Select
                multiple
                value={notifyIds}
                onChange={(e) => setNotifyIds(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput label="Notify" sx={{ fontSize: '0.8rem', height: 36 }} />}
                renderValue={(selected) =>
                  (selected as string[])
                    .map((id) => teamMembers.find((m) => m.id === id)?.full_name ?? teamMembers.find((m) => m.id === id)?.email)
                    .filter(Boolean)
                    .join(', ') || 'No one selected'
                }
              >
                {teamMembers
                  .filter((m) => m.id !== currentUser?.id)
                  .map((m) => (
                    <MenuItem key={m.id} value={m.id} sx={{ fontSize: '0.8rem' }}>
                      <Checkbox size="small" checked={notifyIds.includes(m.id)} sx={{ p: 0.5, mr: 0.5 }} />
                      <ListItemText
                        primary={m.full_name ?? m.email}
                        slotProps={{ primary: { sx: { fontSize: '0.8rem' } } }}
                      />
                    </MenuItem>
                  ))}
                {teamMembers.length <= 1 && (
                  <MenuItem disabled sx={{ fontSize: '0.8rem' }}>
                    No other team members yet
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            <Button
              size="small"
              variant="contained"
              onClick={handleAddComment}
              disabled={!commentBody.trim()}
              sx={{ mt: 1, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
            >
              Comment
            </Button>
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
