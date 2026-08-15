import { Box, Typography, Paper, Chip, Menu, MenuItem, ListItemIcon, useTheme } from '@mui/material';
import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCorners,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { iconFor } from '@/lib/icons';
import type { Issue, IssueStatus } from '@/lib/types';
import { STATUS_COLUMNS, STATUS_META } from '@/lib/constants';
import IssueCard from './IssueCard';

interface BoardViewProps {
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  onIssueMove: (issueId: string, newStatus: IssueStatus) => void;
  onIssueReorder: (issueId: string, targetStatus: IssueStatus, targetIndex: number) => void;
}

function SortableCard({ issue, onClick }: { issue: Issue; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: issue.id,
    data: { status: issue.status },
  });

  return (
    <Box
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      sx={{
        opacity: isDragging ? 0.4 : 1,
        mb: 1,
        '&:active': { cursor: 'grabbing' },
      }}
    >
      <IssueCard issue={issue} onClick={onClick} dragging={isDragging} />
    </Box>
  );
}

function Column({
  status,
  issues,
  onIssueClick,
  isOver,
}: {
  status: IssueStatus;
  issues: Issue[];
  onIssueClick: (issue: Issue) => void;
  isOver: boolean;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const meta = STATUS_META[status];
  const label = STATUS_COLUMNS.find((c) => c.id === status)!.label;
  const PlusIcon = iconFor('Plus');

  return (
    <Paper
      elevation={0}
      sx={{
        width: 300,
        flexShrink: 0,
        bgcolor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 140px)',
        transition: 'all 0.2s ease',
        ...(isOver && { bgcolor: '#eff6ff', borderColor: '#c7d2fe' }),
      }}
    >
      {/* Column header */}
      <Box sx={{ p: 1.5, pb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: meta.color,
            flexShrink: 0,
          }}
        />
        <Typography sx={{ fontSize: '0.78rem', fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </Typography>
        <Chip label={issues.length} size="small" sx={{ height: 20, bgcolor: '#e2e8f0', color: '#64748b', fontSize: '0.68rem', fontWeight: 600, '& .MuiChip-label': { px: 0.75 } }} />
        <Box sx={{ ml: 'auto' }}>
          <PlusIcon size={15} color="#94a3b8" />
        </Box>
      </Box>

      {/* Column body */}
      <Box
        ref={setNodeRef}
        sx={{
          p: 1.25,
          pt: 0.5,
          flex: 1,
          overflowY: 'auto',
          minHeight: 80,
        }}
      >
        {issues.length === 0 ? (
          <Box
            sx={{
              border: '2px dashed #e2e8f0',
              borderRadius: 1.5,
              py: 3,
              textAlign: 'center',
              color: '#cbd5e1',
              fontSize: '0.75rem',
            }}
          >
            Drop issues here
          </Box>
        ) : (
          issues.map((issue) => (
            <SortableCard key={issue.id} issue={issue} onClick={() => onIssueClick(issue)} />
          ))
        )}
      </Box>
    </Paper>
  );
}

export default function BoardView({ issues, onIssueClick, onIssueMove, onIssueReorder }: BoardViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overColumn, setOverColumn] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const grouped = useMemo(() => {
    const map = new Map<IssueStatus, Issue[]>();
    STATUS_COLUMNS.forEach((c) => map.set(c.id, []));
    issues.forEach((i) => {
      const arr = map.get(i.status);
      if (arr) arr.push(i);
    });
    return map;
  }, [issues]);

  const activeIssue = activeId ? issues.find((i) => i.id === activeId) : null;

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as string);
  }

  function handleDragOver(e: { over: { id: string | number } | null }) {
    setOverColumn(e.over ? String(e.over.id) : null);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    setOverColumn(null);
    if (!over) return;

    const draggedIssue = issues.find((i) => i.id === active.id);
    if (!draggedIssue) return;

    // Determine target status: either a column droppable or another card's column
    let targetStatus: IssueStatus | null = null;
    let targetIndex = 0;

    const overId = String(over.id);
    if (STATUS_COLUMNS.some((c) => c.id === overId)) {
      targetStatus = overId as IssueStatus;
    } else {
      const overIssue = issues.find((i) => i.id === overId);
      if (overIssue) {
        targetStatus = overIssue.status;
        const colIssues = grouped.get(targetStatus)!;
        targetIndex = colIssues.findIndex((i) => i.id === overIssue.id);
      }
    }

    if (!targetStatus) return;

    if (targetStatus !== draggedIssue.status) {
      onIssueMove(draggedIssue.id, targetStatus);
    }

    onIssueReorder(draggedIssue.id, targetStatus, targetIndex);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          p: 2,
          overflowX: 'auto',
          height: 'calc(100vh - 56px)',
          alignItems: 'flex-start',
        }}
      >
        {STATUS_COLUMNS.map((col) => (
          <Column
            key={col.id}
            status={col.id}
            issues={grouped.get(col.id) ?? []}
            onIssueClick={onIssueClick}
            isOver={overColumn === col.id}
          />
        ))}
      </Box>

      <DragOverlay>
        {activeIssue ? (
          <Box sx={{ width: 300, opacity: 0.9, transform: 'rotate(2deg)' }}>
            <IssueCard issue={activeIssue} onClick={() => {}} dragging />
          </Box>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
