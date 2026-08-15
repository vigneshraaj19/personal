import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  Divider,
  List,
  ListItem,
  Paper,
} from "@mui/material";
import { iconFor } from "@/lib/icons";
import type { Project } from "@/lib/types";
import type { LucideIcon } from "lucide-react";

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  view: "board" | "backlog";
  onProjectSelect: (id: string) => void;
  onViewChange: (view: "board" | "backlog") => void;
  onCreateProject: () => void;
  onProjectMenu: (project: Project, anchor: HTMLElement) => void;
  onOpenChat?: () => void;
  collapsed: boolean;
  width: number;
}

const navItems: { label: string; icon: string; view: "board" | "backlog" }[] = [
  { label: "Board", icon: "KanbanSquare", view: "board" },
  { label: "Backlog", icon: "ListTodo", view: "backlog" },
];

export default function Sidebar({
  projects,
  activeProjectId,
  view,
  onProjectSelect,
  onViewChange,
  onCreateProject,
  onProjectMenu,
  onOpenChat,
  width,
}: SidebarProps) {
  const active = projects.find((p) => p.id === activeProjectId);

  return (
    <Box
      sx={{
        width,
        flexShrink: 0,
        height: "100vh",
        bgcolor: "#0f172a",
        color: "#cbd5e1",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "width 0.2s ease",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          px: 2,
          py: 2.5,
          display: "flex",
          alignItems: "center",
          gap: 1.25,
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            bgcolor: "linear-gradient(135deg,#6366f1,#4f46e5)",
            background: "linear-gradient(135deg,#6366f1,#4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {(() => {
            const Icon = iconFor("KanbanSquare");
            return <Icon size={18} color="#fff" strokeWidth={2.5} />;
          })()}
        </Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1.05rem",
            color: "#f8fafc",
            letterSpacing: "-0.02em",
          }}
        >
          Vicky Track
        </Typography>
      </Box>

      {/* Active project header */}
      {active && (
        <Box sx={{ px: 2, pb: 1.5 }}>
          <Paper
            elevation={0}
            onClick={(e) => onProjectMenu(active, e.currentTarget)}
            sx={{
              p: 1.25,
              cursor: "pointer",
              bgcolor: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 1.5,
              "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: 1,
                bgcolor: active.color ?? "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {(() => {
                const Icon = iconFor(active.icon ?? "box");
                return <Icon size={15} color="#fff" strokeWidth={2} />;
              })()}
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: "#f1f5f9",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {active.name}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {active.key} project
              </Typography>
            </Box>
            <Box sx={{ flexShrink: 0 }}>
              {(() => {
                const Icon = iconFor("ChevronDown");
                return <Icon size={16} color="#64748b" />;
              })()}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Nav (Board / Backlog) */}
      <List sx={{ px: 1.5, pt: 0.5, pb: 1 }} dense>
        {navItems.map((item) => {
          const Icon = iconFor(item.icon) as LucideIcon;
          const isActive = view === item.view;
          return (
            <ListItem
              key={item.view}
              disablePadding
              sx={{
                mb: 0.25,
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                ...(isActive && { bgcolor: "rgba(99,102,241,0.15)" }),
              }}
            >
              <ListItemButton
                onClick={() => onViewChange(item.view)}
                sx={{
                  borderRadius: 1,
                  py: 0.875,
                  px: 1.5,
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 32, color: isActive ? "#818cf8" : "#94a3b8" }}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.85rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#c7d2fe" : "#cbd5e1",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {onOpenChat && (
        <List sx={{ px: 1.5, pb: 0.5 }} dense>
          <ListItem disablePadding sx={{ borderRadius: 1, "&:hover": { bgcolor: "rgba(255,255,255,0.06)" } }}>
            <ListItemButton
              onClick={onOpenChat}
              sx={{ borderRadius: 1, py: 0.875, px: 1.5, "&:hover": { bgcolor: "transparent" } }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: "#94a3b8" }}>
                {(() => {
                  const Icon = iconFor("MessageCircle");
                  return <Icon size={18} strokeWidth={2} />;
                })()}
              </ListItemIcon>
              <ListItemText
                primary="Team Chat"
                slotProps={{ primary: { sx: { fontSize: "0.85rem", fontWeight: 500, color: "#cbd5e1" } } }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      )}

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mx: 2, my: 0.5 }} />

      {/* Projects list */}
      <Box
        sx={{
          px: 2,
          py: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontSize: "0.7rem",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Projects
        </Typography>
        <Tooltip title="New project">
          <IconButton
            onClick={onCreateProject}
            sx={{
              p: 0.25,
              color: "#64748b",
              "&:hover": { color: "#818cf8", bgcolor: "transparent" },
            }}
          >
            {(() => {
              const Icon = iconFor("Plus");
              return <Icon size={15} />;
            })()}
          </IconButton>
        </Tooltip>
      </Box>

      <List sx={{ px: 1.5, flex: 1, overflowY: "auto", pb: 2 }} dense>
        {projects.map((p) => {
          const Icon = iconFor(p.icon ?? "box") as LucideIcon;
          const isActive = p.id === activeProjectId;
          return (
            <ListItem
              key={p.id}
              disablePadding
              sx={{
                mb: 0.25,
                borderRadius: 1,
                "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                ...(isActive && { bgcolor: "rgba(99,102,241,0.15)" }),
              }}
            >
              <ListItemButton
                onClick={() => onProjectSelect(p.id)}
                sx={{
                  borderRadius: 1,
                  py: 0.625,
                  px: 1.5,
                  "&:hover": { bgcolor: "transparent" },
                }}
              >
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: 0.75,
                    bgcolor: p.color ?? "#4f46e5",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    mr: 1.5,
                  }}
                >
                  <Icon size={13} color="#fff" strokeWidth={2} />
                </Box>
                <ListItemText
                  primary={p.name}
                  slotProps={{
                    primary: {
                      sx: {
                        fontSize: "0.8rem",
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? "#c7d2fe" : "#cbd5e1",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      },
                    },
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
        {projects.length === 0 && (
          <Box sx={{ px: 2, py: 2 }}>
            <Button
              fullWidth
              size="small"
              onClick={onCreateProject}
              sx={{
                color: "#818cf8",
                borderColor: "rgba(255,255,255,0.15)",
                "&:hover": {
                  borderColor: "#818cf8",
                  bgcolor: "rgba(99,102,241,0.1)",
                },
              }}
              variant="outlined"
            >
              Create your first project
            </Button>
          </Box>
        )}
      </List>
    </Box>
  );
}
