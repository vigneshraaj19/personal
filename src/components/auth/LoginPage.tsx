import { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert, Tabs, Tab } from '@mui/material';
import { signIn, signUp } from '@/lib/auth-api';
import { useAuth } from '@/lib/auth-context';
import { iconFor } from '@/lib/icons';

export default function LoginPage() {
  const { setCurrentUser } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const LayersIcon = iconFor('layers');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === 'signin') {
        const profile = await signIn(email, password);
        setCurrentUser(profile);
      } else {
        const profile = await signUp(email, password, fullName || email.split('@')[0]);
        setCurrentUser(profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f8fafc',
        backgroundImage: 'radial-gradient(circle at 20% 20%, #eef2ff 0%, #f8fafc 45%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{ width: 380, p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 3 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayersIcon size={19} color="#fff" strokeWidth={2} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1.1rem' }}>Jira Clone</Typography>
        </Box>

        <Tabs
          value={mode}
          onChange={(_, v) => { setMode(v); setError(null); setInfo(null); }}
          sx={{ mb: 2.5, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' } }}
        >
          <Tab label="Sign in" value="signin" />
          <Tab label="Create account" value="signup" />
        </Tabs>

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
            {mode === 'signup' && (
              <TextField
                label="Full name"
                size="small"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                fullWidth
              />
            )}
            <TextField
              label="Email"
              type="email"
              size="small"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type="password"
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              fullWidth
              helperText={mode === 'signup' ? 'At least 6 characters' : undefined}
            />

            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}
            {info && <Alert severity="success" sx={{ borderRadius: 2 }}>{info}</Alert>}

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' }, borderRadius: 2, py: 1, mt: 0.5 }}
            >
              {loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </Box>
        </form>

        <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8', mt: 2.5, textAlign: 'center' }}>
          The first account created on a fresh project automatically becomes an admin.
        </Typography>
      </Paper>
    </Box>
  );
}
