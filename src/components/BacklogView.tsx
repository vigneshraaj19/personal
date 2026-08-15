import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Chip, IconButton, Tooltip } from '@mui/material';
import type { Issue, IssueStatus } from '@/lib/types';
import { STATUS_COLUMNS, STATUS_META, TYPE_META, PRIORITY_META } from '@/lib/constants';
import { TypeIcon, PriorityIcon, AssigneeAvatar, StatusDot } from './ui/Badges';
import { iconFor } from '@/lib/icons';

interface BacklogViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
}

export default function BacklogView({ issues, onIssueClick }: BacklogViewProps) {
  const CalendarIcon = iconFor('Calendar');

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden' }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 50, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>T</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Key</TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Summary</TableCell>
              <TableCell sx={{ width: 120, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Status</TableCell>
              <TableCell sx={{ width: 90, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Priority</TableCell>
              <TableCell sx={{ width: 70, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Points</TableCell>
              <TableCell sx={{ width: 100, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Due</TableCell>
              <TableCell sx={{ width: 60, fontWeight: 600, fontSize: '0.75rem', color: '#64748b', bgcolor: '#f8fafc' }}>Assignee</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map((issue) => {
              const statusMeta = STATUS_META[issue.status];
              const typeMeta = TYPE_META[issue.type];
              const prioMeta = PRIORITY_META[issue.priority];
              const due = issue.due_date ? new Date(issue.due_date) : null;
              const isOverdue = due && due < new Date(new Date().toDateString()) && issue.status !== 'done';

              return (
                <TableRow
                  key={issue.id}
                  hover
                  onClick={() => onIssueClick(issue)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#f8fafc' } }}
                >
                  <TableCell>
                    <Tooltip title={typeMeta.label}>
                      <Box sx={{ display: 'flex' }}>
                        <TypeIcon type={issue.type} size={15} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>{issue.key}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>
                      {issue.summary}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={<StatusDot status={issue.status} size={8} />}
                      label={STATUS_COLUMNS.find((c) => c.id === issue.status)?.label}
                      size="small"
                      sx={{
                        height: 22,
                        fontSize: '0.7rem',
                        fontWeight: 500,
                        bgcolor: statusMeta.bg,
                        color: statusMeta.color,
                        '& .MuiChip-icon': { ml: 0.75, mr: -0.5 },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PriorityIcon priority={issue.priority} size={14} />
                      <Typography sx={{ fontSize: '0.72rem', color: '#475569', textTransform: 'capitalize' }}>{prioMeta.label}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {issue.story_points != null ? (
                      <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: '50%', bgcolor: '#f1f5f9', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                        {issue.story_points}
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {due ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon size={13} color={isOverdue ? '#dc2626' : '#94a3b8'} />
                        <Typography sx={{ fontSize: '0.72rem', color: isOverdue ? '#dc2626' : '#64748b', fontWeight: isOverdue ? 600 : 400 }}>
                          {due.toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {issue.assignee_name ? (
                      <Tooltip title={issue.assignee_name}>
                        <Box sx={{ display: 'flex' }}>
                          <AssigneeAvatar name={issue.assignee_name} initials={issue.assignee_avatar} size={26} />
                        </Box>
                      </Tooltip>
                    ) : (
                      <Typography sx={{ fontSize: '0.72rem', color: '#cbd5e1' }}>—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {issues.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 6, color: '#94a3b8' }}>
          <Typography sx={{ fontSize: '0.875rem' }}>No issues match your filters.</Typography>
        </Box>
      )}
    </Box>
  );
}
