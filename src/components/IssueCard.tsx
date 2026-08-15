import { Card, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import { iconFor } from '@/lib/icons';
import type { Issue } from '@/lib/types';
import { TypeIcon, PriorityIcon, AssigneeAvatar } from './ui/Badges';

interface IssueCardProps {
  issue: Issue;
  onClick: () => void;
  dragging?: boolean;
}

export default function IssueCard({ issue, onClick, dragging }: IssueCardProps) {
  const MessageIcon = iconFor('MessageCircle');
  const CalendarIcon = iconFor('Calendar');

  const dueDate = issue.due_date ? new Date(issue.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date(new Date().toDateString()) && issue.status !== 'done';

  return (
    <Card
      onClick={onClick}
      sx={{
        p: 1.5,
        cursor: 'grab',
        borderRadius: 1.5,
        border: '1px solid #e2e8f0',
        bgcolor: dragging ? '#eff6ff' : '#fff',
        boxShadow: dragging ? '0 8px 24px rgba(0,0,0,0.08)' : '0 1px 2px rgba(0,0,0,0.04)',
        transition: 'all 0.18s ease',
        '&:hover': {
          borderColor: '#c7d2fe',
          boxShadow: '0 4px 12px rgba(79,70,229,0.1)',
          transform: 'translateY(-1px)',
        },
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Top row: type icon + key */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
        <TypeIcon type={issue.type} size={15} />
        <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.02em' }}>
          {issue.key}
        </Typography>
        {issue.story_points != null && (
          <Box
            sx={{
              ml: 'auto',
              width: 22,
              height: 22,
              borderRadius: '50%',
              bgcolor: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: '#475569',
            }}
          >
            {issue.story_points}
          </Box>
        )}
      </Box>

      {/* Summary */}
      <Typography
        sx={{
          fontSize: '0.82rem',
          fontWeight: 500,
          color: '#1e293b',
          lineHeight: 1.4,
          mb: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {issue.summary}
      </Typography>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {issue.labels.slice(0, 3).map((label) => (
            <Chip
              key={label}
              label={label}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.68rem',
                bgcolor: '#f1f5f9',
                color: '#475569',
                fontWeight: 500,
                '& .MuiChip-label': { px: 0.75 },
              }}
            />
          ))}
          {issue.labels.length > 3 && (
            <Chip label={`+${issue.labels.length - 3}`} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#f1f5f9', color: '#94a3b8' }} />
          )}
        </Box>
      )}

      {/* Bottom row: priority + due date + assignee */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 'auto' }}>
        <Tooltip title={issue.priority}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PriorityIcon priority={issue.priority} size={14} />
          </Box>
        </Tooltip>

        {dueDate && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.375 }}>
            <CalendarIcon size={13} color={isOverdue ? '#dc2626' : '#94a3b8'} />
            <Typography sx={{ fontSize: '0.68rem', color: isOverdue ? '#dc2626' : '#94a3b8', fontWeight: isOverdue ? 600 : 400 }}>
              {dueDate.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
            </Typography>
          </Box>
        )}

        {issue.assignee_name && (
          <Box sx={{ ml: 'auto' }}>
            <Tooltip title={issue.assignee_name}>
              <Box sx={{ display: 'flex' }}>
                <AssigneeAvatar name={issue.assignee_name} initials={issue.assignee_avatar} size={24} />
              </Box>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Card>
  );
}
