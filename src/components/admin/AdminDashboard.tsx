import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Chip,
  Button,
  TextField,
  IconButton,
  Snackbar,
  Alert,
  Grid,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from "@mui/material";
import type { Profile, Team, UserRole, Project, Issue } from "@/lib/types";
import {
  fetchAllProfiles,
  fetchTeams,
  setUserRole,
  setUserTeam,
  createTeam,
  deleteTeam,
  adminCreateUser,
} from "@/lib/auth-api";
import { iconFor } from "@/lib/icons";

function randomPassword() {
  return (
    Math.random().toString(36).slice(-6) +
    Math.random().toString(36).slice(-4).toUpperCase() +
    "!1"
  );
}

interface AdminDashboardProps {
  projects: Project[];
  issues: Issue[];
  onBack: () => void;
}

const createUserInputStyles = {
  "& .MuiOutlinedInput-root": {
    height: 48,
    borderRadius: "11px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",

    "& fieldset": {
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease",
    },

    "&:hover": {
      backgroundColor: "#ffffff",

      "& fieldset": {
        borderColor: "#cbd5e1",
      },
    },

    "&.Mui-focused": {
      backgroundColor: "#ffffff",
      boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.07)",

      "& fieldset": {
        borderColor: "#6366f1",
        borderWidth: "1px",
      },
    },

    "& input": {
      fontSize: "0.84rem",
      color: "#0f172a",
      padding: "0 14px",

      "&::placeholder": {
        color: "#94a3b8",
        opacity: 1,
      },
    },
  },
};

const createSelectStyles = {
  height: 48,
  borderRadius: "11px",
  backgroundColor: "#f8fafc",
  fontSize: "0.84rem",

  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "#e2e8f0",
  },

  "&:hover": {
    backgroundColor: "#ffffff",

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#cbd5e1",
    },
  },

  "&.Mui-focused": {
    backgroundColor: "#ffffff",
    boxShadow: "0 0 0 4px rgba(79, 70, 229, 0.07)",

    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "#6366f1",
      borderWidth: "1px",
    },
  },

  "& .MuiSelect-select": {
    display: "flex",
    alignItems: "center",
    minHeight: "48px !important",
    padding: "0 14px !important",
  },
};

export default function AdminDashboard({
  projects,
  issues,
  onBack,
}: AdminDashboardProps) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Create-user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPassword, setNewPassword] = useState(randomPassword());
  const [newRole, setNewRole] = useState<UserRole>("member");
  const [newTeamId, setNewTeamId] = useState<string>("__none__");
  const [creating, setCreating] = useState(false);
  const [createdCreds, setCreatedCreds] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const ArrowLeft = iconFor("ChevronRight"); // reused as back chevron (flipped below)
  const PlusIcon = iconFor("Plus");
  const TrashIcon = iconFor("Trash2");
  const UsersIcon = iconFor("User");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([fetchAllProfiles(), fetchTeams()]);
      setProfiles(p);
      setTeams(t);
    } catch {
      setError("Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreateUser(): Promise<boolean> {
    if (!newEmail.trim() || !newPassword.trim()) {
      setError("Email and password are required.");
      return false;
    }
    setCreating(true);
    try {
      await adminCreateUser({
        email: newEmail.trim(),
        password: newPassword,
        fullName: newFullName.trim() || newEmail.split("@")[0],
        role: newRole,
        teamId: newTeamId === "__none__" ? null : newTeamId,
      });
      setCreatedCreds({ email: newEmail.trim(), password: newPassword });
      setNewEmail("");
      setNewFullName("");
      setNewPassword(randomPassword());
      setNewRole("member");
      setNewTeamId("__none__");
      load();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(id: string, role: UserRole) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    try {
      await setUserRole(id, role);
    } catch {
      setError("Failed to update role.");
      load();
    }
  }

  async function handleTeamChange(id: string, teamId: string) {
    const value = teamId === "__none__" ? null : teamId;
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, team_id: value } : p)),
    );
    try {
      await setUserTeam(id, value);
    } catch {
      setError("Failed to update team.");
      load();
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) return;
    try {
      const t = await createTeam(newTeamName.trim());
      setTeams((prev) => [...prev, t]);
      setNewTeamName("");
    } catch {
      setError("Failed to create team. Name may already exist.");
    }
  }

  async function handleDeleteTeam(id: string) {
    try {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      load();
    } catch {
      setError("Failed to delete team.");
    }
  }

  const stats = [
    { label: "Total users", value: profiles.length },
    {
      label: "Admins",
      value: profiles.filter((p) => p.role === "admin").length,
    },
    { label: "Teams", value: teams.length },
    { label: "Projects", value: projects.length },
    {
      label: "Open issues",
      value: issues.filter((i) => i.status !== "done").length,
    },
  ];

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        bgcolor: "#f8fafc",
        p: { xs: 2, md: 4 },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <IconButton
          onClick={onBack}
          sx={{ transform: "rotate(180deg)", color: "#64748b" }}
        >
          <ArrowLeft size={18} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: "1.3rem" }}>
            Admin Dashboard
          </Typography>
          <Typography sx={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Manage users, roles, and teams
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setCreateOpen(true)}
          startIcon={<PlusIcon size={16} />}
          sx={{
            bgcolor: "#4f46e5",
            "&:hover": { bgcolor: "#4338ca" },
            borderRadius: 2,
          }}
        >
          Create user
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((s) => (
          <Grid item xs={6} md={2.4} key={s.label}>
            <Paper
              sx={{ p: 2, borderRadius: 3, border: "1px solid #e2e8f0" }}
              elevation={0}
            >
              <Typography
                sx={{ fontSize: "1.6rem", fontWeight: 800, color: "#1e293b" }}
              >
                {s.value}
              </Typography>
              <Typography
                sx={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 500 }}
              >
                {s.label}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Users table */}
        <Grid item xs={12} lg={8}>
          <Paper
            sx={{
              borderRadius: 3,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
            elevation={0}
          >
            <Box
              sx={{
                px: 2.5,
                py: 2,
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <UsersIcon size={16} color="#475569" />
              <Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>
                Users
              </Typography>
            </Box>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      color: "#94a3b8",
                    }}
                  >
                    USER
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      color: "#94a3b8",
                    }}
                  >
                    ROLE
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.72rem",
                      color: "#94a3b8",
                    }}
                  >
                    TEAM
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {profiles.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.25,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 30,
                            height: 30,
                            fontSize: "0.72rem",
                            bgcolor: "#4f46e5",
                          }}
                        >
                          {p.avatar_initials ??
                            p.email.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            sx={{
                              fontSize: "0.82rem",
                              fontWeight: 600,
                              lineHeight: 1.2,
                            }}
                          >
                            {p.full_name ?? p.email}
                          </Typography>
                          <Typography
                            sx={{ fontSize: "0.72rem", color: "#94a3b8" }}
                          >
                            {p.email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={p.role}
                        onChange={(e) =>
                          handleRoleChange(p.id, e.target.value as UserRole)
                        }
                        sx={{ fontSize: "0.78rem", minWidth: 110 }}
                      >
                        <MenuItem value="member">Member</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        size="small"
                        value={p.team_id ?? "__none__"}
                        onChange={(e) => handleTeamChange(p.id, e.target.value)}
                        sx={{ fontSize: "0.78rem", minWidth: 140 }}
                      >
                        <MenuItem value="__none__">No team</MenuItem>
                        {teams.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && profiles.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      sx={{ textAlign: "center", color: "#94a3b8", py: 4 }}
                    >
                      No users yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* Teams panel */}
        <Grid item xs={12} lg={4}>
          <Paper
            sx={{ borderRadius: 3, border: "1px solid #e2e8f0", p: 2.5 }}
            elevation={0}
          >
            <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", mb: 1.5 }}>
              Teams
            </Typography>
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                size="small"
                placeholder="New team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                fullWidth
              />
              <Button
                variant="contained"
                onClick={handleCreateTeam}
                sx={{
                  bgcolor: "#4f46e5",
                  "&:hover": { bgcolor: "#4338ca" },
                  minWidth: 40,
                  px: 1.25,
                }}
              >
                <PlusIcon size={16} />
              </Button>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {teams.map((t) => {
                const memberCount = profiles.filter(
                  (p) => p.team_id === t.id,
                ).length;
                return (
                  <Box
                    key={t.id}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1,
                      borderRadius: 2,
                      bgcolor: "#f8fafc",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          bgcolor: t.color ?? "#4f46e5",
                        }}
                      />
                      <Typography sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
                        {t.name}
                      </Typography>
                      <Chip
                        size="small"
                        label={`${memberCount}`}
                        sx={{
                          height: 18,
                          fontSize: "0.65rem",
                          bgcolor: "#e2e8f0",
                        }}
                      />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteTeam(t.id)}
                    >
                      <TrashIcon size={14} color="#dc2626" />
                    </IconButton>
                  </Box>
                );
              })}
              {teams.length === 0 && (
                <Typography
                  sx={{
                    fontSize: "0.78rem",
                    color: "#94a3b8",
                    textAlign: "center",
                    py: 2,
                  }}
                >
                  No teams yet. Create one above.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Create user dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        fullWidth
        maxWidth="xs"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
              boxShadow: "0 24px 70px rgba(15, 23, 42, 0.16)",
            },
          },
        }}
      >
        {/* HEADER */}
        <DialogTitle
          sx={{
            px: 3,
            pt: 3,
            pb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Create user
          </Typography>

          <Typography
            sx={{
              mt: 0.5,
              fontSize: "0.8rem",
              color: "#64748b",
            }}
          >
            Add a new user and configure their workspace access.
          </Typography>
        </DialogTitle>

        {/* CONTENT */}
        <DialogContent
          sx={{
            px: 3,
            pt: 1.5,
            pb: 1,
          }}
        >
          {/* FULL NAME */}
          <Box sx={{ mb: 2.2 }}>
            <Typography
              sx={{
                mb: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Full name
            </Typography>

            <TextField
              placeholder="Vignesh Raaj"
              size="small"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              fullWidth
              sx={createUserInputStyles}
            />
          </Box>

          {/* EMAIL */}
          <Box sx={{ mb: 2.2 }}>
            <Typography
              sx={{
                mb: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Email address
              <Box
                component="span"
                sx={{
                  ml: 0.3,
                  color: "#ef4444",
                }}
              >
                *
              </Box>
            </Typography>

            <TextField
              placeholder="user@example.com"
              type="email"
              size="small"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              required
              sx={createUserInputStyles}
            />
          </Box>

          {/* PASSWORD */}
          <Box sx={{ mb: 2.2 }}>
            <Typography
              sx={{
                mb: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Temporary password
              <Box
                component="span"
                sx={{
                  ml: 0.3,
                  color: "#ef4444",
                }}
              >
                *
              </Box>
            </Typography>

            <TextField
              placeholder="Enter temporary password"
              size="small"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              sx={createUserInputStyles}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button
                        size="small"
                        onClick={() => setNewPassword(randomPassword())}
                        sx={{
                          minWidth: "auto",
                          px: 1,
                          borderRadius: "7px",
                          color: "#4f46e5",
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          textTransform: "none",

                          "&:hover": {
                            bgcolor: "#eef2ff",
                          },
                        }}
                      >
                        Regenerate
                      </Button>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Typography
              sx={{
                mt: 0.6,
                fontSize: "0.68rem",
                color: "#94a3b8",
              }}
            >
              Share this temporary password with the user.
            </Typography>
          </Box>

          {/* ROLE */}
          <Box sx={{ mb: 2.2 }}>
            <Typography
              sx={{
                mb: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Role
              <Box
                component="span"
                sx={{
                  ml: 0.3,
                  color: "#ef4444",
                }}
              >
                *
              </Box>
            </Typography>

            <Select
              size="small"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as UserRole)}
              fullWidth
              sx={createSelectStyles}
            >
              <MenuItem value="member">Member</MenuItem>

              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </Box>

          {/* TEAM */}
          <Box>
            <Typography
              sx={{
                mb: 0.8,
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#334155",
              }}
            >
              Team
            </Typography>

            <Select
              size="small"
              value={newTeamId}
              onChange={(e) => setNewTeamId(e.target.value)}
              fullWidth
              sx={createSelectStyles}
            >
              <MenuItem value="__none__">No team</MenuItem>

              {teams.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            mt: 1,
            borderTop: "1px solid #f1f5f9",
            gap: 1,
          }}
        >
          <Button
            onClick={() => setCreateOpen(false)}
            sx={{
              height: 42,
              px: 2,
              borderRadius: "10px",
              color: "#64748b",
              textTransform: "none",
              fontWeight: 600,

              "&:hover": {
                bgcolor: "#f8fafc",
              },
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            disabled={creating}
            onClick={async () => {
              const ok = await handleCreateUser();

              if (ok) {
                setCreateOpen(false);
              }
            }}
            sx={{
              height: 42,
              px: 2.5,
              borderRadius: "10px",
              bgcolor: "#4f46e5",
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "0 6px 16px rgba(79, 70, 229, 0.22)",

              "&:hover": {
                bgcolor: "#4338ca",
                boxShadow: "0 8px 20px rgba(79, 70, 229, 0.28)",
              },

              "&:disabled": {
                bgcolor: "#a5b4fc",
                color: "#fff",
              },
            }}
          >
            {creating ? "Creating…" : "Create user"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Credentials confirmation */}
      <Dialog
        open={!!createdCreds}
        onClose={() => setCreatedCreds(null)}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: "1rem" }}>
          User created
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.85rem", color: "#64748b", mb: 1.5 }}>
            Share these sign-in details with the new user. If email confirmation
            is enabled on your Supabase project, they'll need to confirm their
            email before they can sign in.
          </Typography>
          <Paper
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
            elevation={0}
          >
            <Typography sx={{ fontSize: "0.8rem" }}>
              <b>Email:</b> {createdCreds?.email}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem" }}>
              <b>Password:</b> {createdCreds?.password}
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            onClick={() => setCreatedCreds(null)}
            sx={{
              bgcolor: "#4f46e5",
              "&:hover": { bgcolor: "#4338ca" },
              borderRadius: 2,
            }}
          >
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={() => setSuccess(null)}
      >
        <Alert severity="success" onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
}
