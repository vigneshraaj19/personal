import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, ToggleButtonGroup, ToggleButton, Divider, InputAdornment } from '@mui/material';
import { useState, useEffect } from 'react';
import { CalendarDays, User, Hash, Tag, X } from 'lucide-react';
import type { Issue, IssueType, IssuePriority, IssueStatus } from '@/lib/types';
import { ALL_TYPES, ALL_PRIORITIES, TYPE_META, PRIORITY_META, STATUS_COLUMNS } from '@/lib/constants';
import { TypeIcon, PriorityIcon } from './ui/Badges';

interface IssueDialogProps {
  open: boolean;
  onClose: () => void;
  projectKey: string;
  nextNumber: number;
  editingIssue: Issue | null;
  onSubmit: (data: {
    summary: string;
    description: string | null;
    type: IssueType;
    priority: IssuePriority;
    status: IssueStatus;
    assignee_name: string | null;
    story_points: number | null;
    due_date: string | null;
    labels: string[];
  }) => void;
}

const defaultData = {
  summary: '',
  description: '',
  type: 'task' as IssueType,
  priority: 'medium' as IssuePriority,
  status: 'backlog' as IssueStatus,
  assignee_name: '',
  story_points: '',
  due_date: '',
  labels: '',
};

const sectionLabelSx = {
  fontSize: '0.7rem',
  fontWeight: 700,
  color: '#94a3b8',
  mb: 0.75,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.06em',
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2.5,
    fontSize: '0.875rem',
    bgcolor: '#f8fafc',
    transition: 'all 0.15s ease',
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#c7d2fe' },
    '&.Mui-focused': {
      bgcolor: '#fff',
      '& fieldset': { borderColor: '#6366f1', borderWidth: '1.5px' },
    },
  },
};

const toggleGroupSx = (size: 'md' | 'sm' = 'md') => ({
  gap: 0.6,
  flexWrap: 'wrap' as const,
  '& .MuiToggleButton-root': {
    border: '1px solid #e2e8f0 !important',
    borderRadius: '10px !important',
    px: size === 'md' ? 1.5 : 1.1,
    py: size === 'md' ? 0.7 : 0.5,
    gap: 0.5,
    textTransform: 'none' as const,
    fontSize: size === 'md' ? '0.78rem' : '0.72rem',
    fontWeight: 500,
    color: '#64748b',
    bgcolor: '#fff',
    transition: 'all 0.15s ease',
    '&.Mui-selected': {
      bgcolor: '#eef2ff',
      color: '#4f46e5',
      fontWeight: 600,
      borderColor: '#c7d2fe !important',
      boxShadow: '0 1px 2px rgba(79,70,229,0.15)',
    },
    '&:hover': { bgcolor: '#f8fafc', borderColor: '#cbd5e1 !important' },
    '&.Mui-selected:hover': { bgcolor: '#e0e7ff' },
  },
});

export default function IssueDialog({ open, onClose, projectKey, nextNumber, editingIssue, onSubmit }: IssueDialogProps) {
  const [data, setData] = useState(defaultData);

  useEffect(() => {
    if (editingIssue) {
      setData({
        summary: editingIssue.summary,
        description: editingIssue.description ?? '',
        type: editingIssue.type,
        priority: editingIssue.priority,
        status: editingIssue.status,
        assignee_name: editingIssue.assignee_name ?? '',
        story_points: editingIssue.story_points != null ? String(editingIssue.story_points) : '',
        due_date: editingIssue.due_date ?? '',
        labels: editingIssue.labels?.join(', ') ?? '',
      });
    } else {
      setData(defaultData);
    }
  }, [editingIssue, open]);

  const issueKey = editingIssue?.key ?? `${projectKey}-${nextNumber}`;

  function handleSubmit() {
    if (!data.summary.trim()) return;
    onSubmit({
      summary: data.summary.trim(),
      description: data.description.trim() || null,
      type: data.type,
      priority: data.priority,
      status: data.status,
      assignee_name: data.assignee_name.trim() || null,
      story_points: data.story_points ? parseInt(data.story_points, 10) : null,
      due_date: data.due_date || null,
      labels: data.labels.split(',').map((l) => l.trim()).filter(Boolean),
    });
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 4, overflow: 'hidden', boxShadow: '0 24px 60px -12px rgba(15,23,42,0.25)' } } }}
    >

      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.25, pt: 2.5, pb: 2, px: 3 }}>
        <Box
          sx={{
            width: 34,
            height: 34,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#eef2ff',
            flexShrink: 0,
          }}
        >
          <TypeIcon type={data.type} size={18} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', lineHeight: 1.2 }}>
            {editingIssue ? 'Edit Issue' : 'Create Issue'}
          </Typography>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.02em' }}>
            {issueKey}
          </Typography>
        </Box>
        <Box
          onClick={onClose}
          sx={{
            ml: 'auto',
            width: 30,
            height: 30,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            '&:hover': { bgcolor: '#f1f5f9', color: '#64748b' },
          }}
        >
          <X size={17} />
        </Box>
      </DialogTitle>

      <Divider sx={{ borderColor: '#f1f5f9' }} />

      <DialogContent sx={{ pt: 2.5, px: 3, pb: 1 }}>
        {/* Type selector */}
        <Typography sx={sectionLabelSx}>Issue Type</Typography>
        <ToggleButtonGroup
          exclusive
          value={data.type}
          onChange={(_, v) => v && setData((d) => ({ ...d, type: v as IssueType }))}
          sx={{ ...toggleGroupSx('md'), mb: 2.5 }}
        >
          {ALL_TYPES.map((t) => (
            <ToggleButton key={t} value={t}>
              <TypeIcon type={t} size={15} />
              {TYPE_META[t].label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {/* Summary */}
        <Typography sx={sectionLabelSx}>Summary *</Typography>
        <TextField
          fullWidth
          required
          autoFocus
          value={data.summary}
          onChange={(e) => setData((d) => ({ ...d, summary: e.target.value }))}
          placeholder="What needs to be done?"
          sx={{ ...fieldSx, mb: 2.5 }}
        />

        {/* Description */}
        <Typography sx={sectionLabelSx}>Description</Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          value={data.description}
          onChange={(e) => setData((d) => ({ ...d, description: e.target.value }))}
          placeholder="Add more detail..."
          sx={{ ...fieldSx, mb: 2.5 }}
        />

        {/* Priority + Status */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 2.5 }}>
          <Box>
            <Typography sx={sectionLabelSx}>Priority</Typography>
            <ToggleButtonGroup
              exclusive
              value={data.priority}
              onChange={(_, v) => v && setData((d) => ({ ...d, priority: v as IssuePriority }))}
              sx={toggleGroupSx('sm')}
            >
              {ALL_PRIORITIES.map((p) => (
                <ToggleButton key={p} value={p}>
                  <PriorityIcon priority={p} size={13} />
                  {PRIORITY_META[p].label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography sx={sectionLabelSx}>Status</Typography>
            <ToggleButtonGroup
              exclusive
              value={data.status}
              onChange={(_, v) => v && setData((d) => ({ ...d, status: v as IssueStatus }))}
              sx={toggleGroupSx('sm')}
            >
              {STATUS_COLUMNS.map((s) => (
                <ToggleButton key={s.id} value={s.id}>{s.label}</ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Divider sx={{ borderColor: '#f1f5f9', mb: 2.5 }} />

        {/* Assignee + points + due date + labels */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 1 }}>
          <Box>
            <Typography sx={sectionLabelSx}>Assignee</Typography>
            <TextField
              fullWidth
              size="small"
              value={data.assignee_name}
              onChange={(e) => setData((d) => ({ ...d, assignee_name: e.target.value }))}
              placeholder="Name"
              sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><User size={15} color="#94a3b8" /></InputAdornment> }}
            />
          </Box>
          <Box>
            <Typography sx={sectionLabelSx}>Story Points</Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              value={data.story_points}
              onChange={(e) => setData((d) => ({ ...d, story_points: e.target.value }))}
              placeholder="0"
              sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><Hash size={15} color="#94a3b8" /></InputAdornment> }}
            />
          </Box>
          <Box>
            <Typography sx={sectionLabelSx}>Due Date</Typography>
            <TextField
              fullWidth
              size="small"
              type="date"
              value={data.due_date}
              onChange={(e) => setData((d) => ({ ...d, due_date: e.target.value }))}
              sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><CalendarDays size={15} color="#94a3b8" /></InputAdornment> }}
            />
          </Box>
          <Box>
            <Typography sx={sectionLabelSx}>Labels</Typography>
            <TextField
              fullWidth
              size="small"
              value={data.labels}
              onChange={(e) => setData((d) => ({ ...d, labels: e.target.value }))}
              placeholder="frontend, auth"
              sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><Tag size={15} color="#94a3b8" /></InputAdornment> }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, pt: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#64748b', fontWeight: 600, borderRadius: 2, px: 2, '&:hover': { bgcolor: '#f1f5f9' } }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!data.summary.trim()}
          sx={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            fontWeight: 600,
            borderRadius: 2,
            px: 2.5,
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #4338ca)', boxShadow: '0 6px 16px rgba(79,70,229,0.4)' },
            '&.Mui-disabled': { background: '#e2e8f0', boxShadow: 'none', color: '#94a3b8' },
          }}
        >
          {editingIssue ? 'Save Changes' : 'Create Issue'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}