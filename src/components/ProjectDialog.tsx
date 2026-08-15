import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { useState } from 'react';
import { iconFor } from '@/lib/icons';
import { PROJECT_ICONS, PROJECT_COLORS } from '@/lib/constants';
import type { LucideIcon } from 'lucide-react';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { key: string; name: string; description: string; icon: string; color: string }) => void;
}

export default function ProjectDialog({ open, onClose, onSubmit }: ProjectDialogProps) {
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('box');
  const [color, setColor] = useState('#4f46e5');

  function handleSubmit() {
    if (!key.trim() || !name.trim()) return;
    onSubmit({
      key: key.trim().toUpperCase().slice(0, 4),
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
    });
    setKey('');
    setName('');
    setDescription('');
    setIcon('box');
    setColor('#4f46e5');
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1rem', pb: 1 }}>Create New Project</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 2, mb: 2 }}>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Key</Typography>
            <TextField
              fullWidth
              size="small"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
              placeholder="ENG"
              slotProps={{ htmlInput: { maxLength: 4 } }}
            />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Project Name *</Typography>
            <TextField
              fullWidth
              size="small"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Project"
            />
          </Box>
        </Box>

        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</Typography>
        <TextField
          fullWidth
          multiline
          minRows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          sx={{ mb: 2 }}
        />

        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Icon</Typography>
        <ToggleButtonGroup
          exclusive
          value={icon}
          onChange={(_, v) => v && setIcon(v)}
          sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5, '& .MuiToggleButtonGroup-grouped': { border: 'none', borderRadius: '8px !important' }, '& .MuiToggleButton-root': { width: 40, height: 40, p: 0, color: '#64748b', bgcolor: '#f1f5f9', '&.Mui-selected': { bgcolor: '#eef2ff', color: '#4f46e5' }, '&:hover': { bgcolor: '#e2e8f0' } } }}
        >
          {PROJECT_ICONS.map((ic) => {
            const Icon = iconFor(ic) as LucideIcon;
            return (
              <ToggleButton key={ic} value={ic}>
                <Icon size={18} />
              </ToggleButton>
            );
          })}
        </ToggleButtonGroup>

        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', mb: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Color</Typography>
        <ToggleButtonGroup
          exclusive
          value={color}
          onChange={(_, v) => v && setColor(v)}
          sx={{ gap: 0.5, '& .MuiToggleButtonGroup-grouped': { border: 'none', borderRadius: '50% !important' }, '& .MuiToggleButton-root': { width: 32, height: 32, p: 0, border: 'none', '&.Mui-selected': { outline: '3px solid #4f46e5', outlineOffset: 2 } } }}
        >
          {PROJECT_COLORS.map((c) => (
            <ToggleButton key={c} value={c} sx={{ bgcolor: c, '&:hover': { bgcolor: c, opacity: 0.85 } }} />
          ))}
        </ToggleButtonGroup>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} sx={{ color: '#64748b' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!key.trim() || !name.trim()}
          sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2 }}
        >
          Create Project
        </Button>
      </DialogActions>
    </Dialog>
  );
}
