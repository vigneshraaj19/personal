import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Snackbar,
  Alert,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from "@mui/material";
import theme from "@/lib/theme";
import type { Project, Issue, IssueStatus } from "@/lib/types";
import {
  fetchProjects,
  fetchIssues,
  createIssue,
  updateIssue,
  createProject,
  deleteProject,
  getNextIssueNumber,
} from "@/lib/api";
import { iconFor } from "@/lib/icons";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import BoardView from "@/components/BoardView";
import BacklogView from "@/components/BacklogView";
import IssueDetail from "@/components/IssueDetail";
import IssueDialog from "@/components/IssueDialog";
import ProjectDialog from "@/components/ProjectDialog";
import LoginPage from "@/components/auth/LoginPage";
import AdminDashboard from "@/components/admin/AdminDashboard";
import ChatView from "@/components/chat/ChatView";
import { useAuth } from "@/lib/auth-context";
//wgwegwgwg

export default function App() {
  const { profile, loading: authLoading, isAdmin, logout } = useAuth();
  const [appView, setAppView] = useState<"board" | "admin" | "chat">("board");

  if (authLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f8fafc",
          }}
        >
          <CircularProgress size={28} sx={{ color: "#4f46e5" }} />
        </Box>
      </ThemeProvider>
    );
  }

  if (!profile) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoginPage />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MainApp
        profile={profile}
        isAdmin={isAdmin}
        appView={appView}
        onOpenAdmin={() => setAppView("admin")}
        onOpenChat={() => setAppView("chat")}
        onBackFromAdmin={() => setAppView("board")}
        onSignOut={logout}
      />
    </ThemeProvider>
  );
}

function MainApp({
  profile,
  isAdmin,
  appView,
  onOpenAdmin,
  onOpenChat,
  onBackFromAdmin,
  onSignOut,
}: {
  profile: import("@/lib/types").Profile | null;
  isAdmin: boolean;
  appView: "board" | "admin" | "chat";
  onOpenAdmin: () => void;
  onOpenChat: () => void;
  onBackFromAdmin: () => void;
  onSignOut: () => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [view, setView] = useState<"board" | "backlog">("board");
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dialogs / drawers
  const [detailIssue, setDetailIssue] = useState<Issue | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [issueDialogOpen, setIssueDialogOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [projectMenuAnchor, setProjectMenuAnchor] = useState<{
    el: HTMLElement;
    project: Project;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Project | null>(null);

  // Loading + error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextNumber, setNextNumber] = useState(1);

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  // ── Load projects ──────────────────────────────────────
  const loadProjects = useCallback(async () => {
    try {
      const p = await fetchProjects();
      setProjects(p);
      if (p.length > 0 && !activeProjectId) {
        setActiveProjectId(p[0].id);
      }
    } catch {
      setError("Failed to load projects.");
    }
  }, [activeProjectId]);

  // ── Load issues for active project ─────────────────────
  const loadIssues = useCallback(async () => {
    if (!activeProjectId) {
      setIssues([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const i = await fetchIssues(activeProjectId);
      setIssues(i);
    } catch {
      setError("Failed to load issues.");
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);
  useEffect(() => {
    loadIssues();
  }, [loadIssues]);

  // ── Refresh next issue number ──────────────────────────
  useEffect(() => {
    if (activeProject) {
      getNextIssueNumber(activeProject.key)
        .then(setNextNumber)
        .catch(() => setNextNumber(1));
    }
  }, [activeProject, issues.length]);

  // ── Filtered issues (search) ───────────────────────────
  const filteredIssues = useMemo(() => {
    if (!search.trim()) return issues;
    const q = search.toLowerCase();
    return issues.filter(
      (i) =>
        i.summary.toLowerCase().includes(q) ||
        i.key.toLowerCase().includes(q) ||
        i.assignee_name?.toLowerCase().includes(q) ||
        i.labels?.some((l) => l.toLowerCase().includes(q)),
    );
  }, [issues, search]);

  // ── Handlers ───────────────────────────────────────────
  function handleIssueClick(issue: Issue) {
    setDetailIssue(issue);
    setDetailOpen(true);
  }

  function handleIssueUpdated(updated: Issue) {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (detailIssue?.id === updated.id) setDetailIssue(updated);
  }

  function handleIssueDeleted(id: string) {
    setIssues((prev) => prev.filter((i) => i.id !== id));
    setDetailOpen(false);
  }

  async function handleIssueMove(issueId: string, newStatus: IssueStatus) {
    setIssues((prev) =>
      prev.map((i) => (i.id === issueId ? { ...i, status: newStatus } : i)),
    );
    try {
      const updated = await updateIssue(issueId, { status: newStatus });
      setIssues((prev) => prev.map((i) => (i.id === issueId ? updated : i)));
    } catch {
      setError("Failed to move issue. Reverting.");
      loadIssues();
    }
  }

  async function handleIssueReorder(
    issueId: string,
    targetStatus: IssueStatus,
    targetIndex: number,
  ) {
    // Optimistic reorder: rebuild rank order within the target column
    const colIssues = issues.filter(
      (i) => i.status === targetStatus && i.id !== issueId,
    );
    const moved = issues.find((i) => i.id === issueId);
    if (!moved) return;
    colIssues.splice(targetIndex, 0, { ...moved, status: targetStatus });
    const reordered = colIssues.map((i, idx) => ({ ...i, rank: idx }));
    setIssues((prev) => {
      const others = prev.filter(
        (i) => i.status !== targetStatus && i.id !== issueId,
      );
      return [...others, ...reordered];
    });
    // Persist rank updates in background
    reordered.forEach((i, idx) => {
      if (i.rank !== idx || i.status !== targetStatus) {
        updateIssue(i.id, { rank: idx, status: targetStatus }).catch(() => {});
      }
    });
  }

  async function handleCreateIssue(data: {
    summary: string;
    description: string | null;
    type: Issue["type"];
    priority: Issue["priority"];
    status: IssueStatus;
    assignee_name: string | null;
    story_points: number | null;
    due_date: string | null;
    labels: string[];
  }) {
    if (!activeProject) return;
    try {
      if (editingIssue) {
        const updated = await updateIssue(editingIssue.id, {
          summary: data.summary,
          description: data.description,
          type: data.type,
          priority: data.priority,
          status: data.status,
          assignee_name: data.assignee_name,
          assignee_avatar: data.assignee_name
            ? data.assignee_name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : null,
          story_points: data.story_points,
          due_date: data.due_date,
          labels: data.labels.length ? data.labels : null,
        });
        handleIssueUpdated(updated);
      } else {
        const created = await createIssue({
          project_id: activeProject.id,
          key: `${activeProject.key}-${nextNumber}`,
          summary: data.summary,
          description: data.description,
          type: data.type,
          priority: data.priority,
          status: data.status,
          assignee_name: data.assignee_name,
          assignee_avatar: data.assignee_name
            ? data.assignee_name
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()
            : null,
          reporter_name: "You",
          labels: data.labels.length ? data.labels : null,
          story_points: data.story_points,
          due_date: data.due_date,
          rank: issues.length,
        });
        setIssues((prev) => [...prev, created]);
      }
      setEditingIssue(null);
    } catch {
      setError("Failed to save issue.");
    }
  }

  async function handleCreateProject(data: {
    key: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  }) {
    try {
      const p = await createProject(data);
      setProjects((prev) => [...prev, p]);
      setActiveProjectId(p.id);
      setProjectDialogOpen(false);
    } catch {
      setError("Failed to create project. Key may already be in use.");
    }
  }

  async function handleDeleteProject(id: string) {
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (activeProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id);
        setActiveProjectId(remaining[0]?.id ?? null);
      }
      setDeleteConfirm(null);
    } catch {
      setError("Failed to delete project.");
    }
  }

  function openCreateIssue() {
    setEditingIssue(null);
    setIssueDialogOpen(true);
  }

  function openEditIssue(issue: Issue) {
    setEditingIssue(issue);
    setIssueDialogOpen(true);
  }

  const TrashIcon = iconFor("Trash2");
  const PencilIcon = iconFor("Pencil");
  const sidebarWidth = sidebarOpen ? 256 : 0;

  if (appView === "admin") {
    return (
      <AdminDashboard
        projects={projects}
        issues={issues}
        onBack={onBackFromAdmin}
      />
    );
  }

  if (appView === "chat") {
    if (!profile) return null;
    return <ChatView currentUser={profile} onBack={onBackFromAdmin} />;
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          bgcolor: "#f8fafc",
        }}
      >
        {sidebarOpen && (
          <Sidebar
            projects={projects}
            activeProjectId={activeProjectId}
            view={view}
            onProjectSelect={setActiveProjectId}
            onViewChange={setView}
            onCreateProject={() => setProjectDialogOpen(true)}
            onProjectMenu={(project, el) =>
              setProjectMenuAnchor({ el, project })
            }
            onOpenChat={onOpenChat}
            collapsed={!sidebarOpen}
            width={sidebarWidth}
          />
        )}

        {/* Main area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          <TopBar
            project={activeProject}
            issues={issues}
            view={view}
            search={search}
            onSearchChange={setSearch}
            onCreateIssue={openCreateIssue}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            profile={profile}
            isAdmin={isAdmin}
            onOpenAdmin={onOpenAdmin}
            onSignOut={onSignOut}
          />

          <Box sx={{ flex: 1, overflow: "hidden" }}>
            {!activeProject ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{ fontSize: "1.1rem", fontWeight: 600, color: "#475569" }}
                >
                  No project selected
                </Typography>
                <Typography sx={{ fontSize: "0.85rem", color: "#94a3b8" }}>
                  Create a project to get started.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => setProjectDialogOpen(true)}
                  sx={{
                    bgcolor: "#4f46e5",
                    "&:hover": { bgcolor: "#4338ca" },
                    borderRadius: 2,
                    mt: 1,
                  }}
                >
                  Create Project
                </Button>
              </Box>
            ) : loading ? (
              <Box
                sx={{
                  p: 3,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, 300px)",
                  gap: 1.5,
                }}
              >
                {[0, 1, 2, 3, 4].map((i) => (
                  <Box
                    key={i}
                    className="shimmer"
                    sx={{ height: 120, borderRadius: 2 }}
                  />
                ))}
              </Box>
            ) : view === "board" ? (
              <BoardView
                issues={filteredIssues}
                onIssueClick={handleIssueClick}
                onIssueMove={handleIssueMove}
                onIssueReorder={handleIssueReorder}
              />
            ) : (
              <BacklogView
                issues={filteredIssues}
                onIssueClick={handleIssueClick}
              />
            )}
          </Box>
        </Box>

        {/* Issue detail drawer */}
        <IssueDetail
          issue={detailIssue}
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          onIssueUpdated={handleIssueUpdated}
          onIssueDeleted={handleIssueDeleted}
          currentUser={profile}
        />

        {/* Issue create/edit dialog */}
        <IssueDialog
          open={issueDialogOpen}
          onClose={() => {
            setIssueDialogOpen(false);
            setEditingIssue(null);
          }}
          projectKey={activeProject?.key ?? ""}
          nextNumber={nextNumber}
          editingIssue={editingIssue}
          onSubmit={handleCreateIssue}
        />

        {/* Project create dialog */}
        <ProjectDialog
          open={projectDialogOpen}
          onClose={() => setProjectDialogOpen(false)}
          onSubmit={handleCreateProject}
        />

        {/* Project context menu */}
        <Menu
          open={!!projectMenuAnchor}
          anchorEl={projectMenuAnchor?.el ?? null}
          onClose={() => setProjectMenuAnchor(null)}
          slotProps={{
            paper: { sx: { borderRadius: 2, mt: 1, minWidth: 200 } },
          }}
        >
          <MenuItem
            onClick={() => {
              if (projectMenuAnchor) {
                setActiveProjectId(projectMenuAnchor.project.id);
                setProjectMenuAnchor(null);
              }
            }}
          >
            <ListItemIcon>
              <PencilIcon size={16} color="#475569" />
            </ListItemIcon>
            <ListItemText
              primary="Switch to project"
              slotProps={{ primary: { sx: { fontSize: "0.82rem" } } }}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (projectMenuAnchor) {
                setDeleteConfirm(projectMenuAnchor.project);
                setProjectMenuAnchor(null);
              }
            }}
            sx={{ color: "#dc2626" }}
          >
            <ListItemIcon>
              <TrashIcon size={16} color="#dc2626" />
            </ListItemIcon>
            <ListItemText
              primary="Delete project"
              slotProps={{ primary: { sx: { fontSize: "0.82rem" } } }}
            />
          </MenuItem>
        </Menu>

        {/* Delete project confirmation */}
        <Dialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          slotProps={{ paper: { sx: { borderRadius: 3 } } }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: "1rem" }}>
            Delete "{deleteConfirm?.name}"?
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ fontSize: "0.85rem", color: "#64748b" }}>
              This will permanently delete the project and all {issues.length}{" "}
              issues inside it. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button
              onClick={() => setDeleteConfirm(null)}
              sx={{ color: "#64748b" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() =>
                deleteConfirm && handleDeleteProject(deleteConfirm.id)
              }
              sx={{ borderRadius: 2 }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Error snackbar */}
        <Snackbar
          open={!!error}
          autoHideDuration={4000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ borderRadius: 2 }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}
