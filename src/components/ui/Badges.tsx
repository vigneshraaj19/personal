import { Avatar as MuiAvatar } from '@mui/material';
import type { IssueType, IssuePriority, IssueStatus } from '@/lib/types';
import { TYPE_META, PRIORITY_META, STATUS_META } from '@/lib/constants';
import { iconFor } from '@/lib/icons';

export function AssigneeAvatar({
  name,
  initials,
  size = 28,
}: {
  name: string | null;
  initials?: string | null;
  size?: number;
}) {
  if (!name) {
    return (
      <MuiAvatar
        sx={{
          width: size,
          height: size,
          bgcolor: '#e2e8f0',
          fontSize: size * 0.4,
          fontWeight: 600,
          color: '#94a3b8',
        }}
      >
        ?
      </MuiAvatar>
    );
  }
  const text = initials ?? name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  const hue = name.charCodeAt(0) % 6;
  const colors = ['#4f46e5', '#0d9488', '#db2777', '#ea580c', '#2563eb', '#7c3aed'];
  return (
    <MuiAvatar
      sx={{
        width: size,
        height: size,
        bgcolor: colors[hue],
        fontSize: size * 0.38,
        fontWeight: 600,
        color: '#fff',
      }}
    >
      {text}
    </MuiAvatar>
  );
}

export function TypeIcon({ type, size = 16 }: { type: IssueType; size?: number }) {
  const meta = TYPE_META[type];
  const Icon = iconFor(meta.icon);
  return <Icon size={size} color={meta.color} strokeWidth={2} />;
}

export function PriorityIcon({ priority, size = 16 }: { priority: IssuePriority; size?: number }) {
  const meta = PRIORITY_META[priority];
  const Icon = iconFor(meta.icon);
  return <Icon size={size} color={meta.color} strokeWidth={2.5} />;
}

export function StatusDot({ status, size = 10 }: { status: IssueStatus; size?: number }) {
  const meta = STATUS_META[status];
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: meta.color,
      }}
    />
  );
}
