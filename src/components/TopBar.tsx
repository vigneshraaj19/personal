import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Chip,
  InputBase,
  Paper,
  AvatarGroup,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import { iconFor } from "@/lib/icons";
import type { Project, Issue, Profile } from "@/lib/types";
import { AssigneeAvatar } from "./ui/Badges";
import NotificationBell from "./NotificationBell";

interface TopBarProps {
  project: Project | null;
  issues: Issue[];
  view: "board" | "backlog";
  search: string;
  onSearchChange: (val: string) => void;
  onCreateIssue: () => void;
  onToggleSidebar: () => void;
  profile?: Profile | null;
  isAdmin?: boolean;
  onOpenAdmin?: () => void;
  onSignOut?: () => void;
}

export default function TopBar({
  project,
  issues,
  view,
  search,
  onSearchChange,
  onCreateIssue,
  onToggleSidebar,
  profile,
  isAdmin,
  onOpenAdmin,
  onSignOut,
}: TopBarProps) {
  const MenuIcon = iconFor("KanbanSquare");
  const SearchIcon = iconFor("Search");
  const PlusIcon = iconFor("Plus");
  const SettingsIcon = iconFor("Settings");
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(
    null,
  );

  const members = issues
    .filter((i) => i.assignee_name)
    .filter(
      (i, idx, arr) =>
        arr.findIndex((x) => x.assignee_name === i.assignee_name) === idx,
    )
    .slice(0, 5);

  const counts = {
    total: issues.length,
    done: issues.filter((i) => i.status === "done").length,
    inProgress: issues.filter(
      (i) => i.status === "in_progress" || i.status === "in_review",
    ).length,
  };

  return (
    <AppBar
      position="static"
      sx={{
        bgcolor: "#fff",
        borderBottom: "1px solid #e2e8f0",
        color: "#0f172a",
      }}
    >
      <Toolbar sx={{ minHeight: "56px !important", px: 2, gap: 2 }}>
        <IconButton onClick={onToggleSidebar} sx={{ color: "#64748b" }}>
          <MenuIcon size={20} />
        </IconButton>

        {project && (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: project.color ?? "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {(() => {
                const Icon = iconFor(project.icon ?? "box");
                return <Icon size={17} color="#fff" strokeWidth={2} />;
              })()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  lineHeight: 1.2,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {project.name}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {view === "board" ? "Kanban Board" : "Backlog List"}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Search */}
        <Paper
          sx={{
            ml: "auto",
            display: "flex",
            alignItems: "center",
            width: 240,
            height: 34,
            bgcolor: "#f1f5f9",
            border: "1px solid transparent",
            borderRadius: 2,
            px: 1.25,
            gap: 0.75,
            boxShadow: "none",
            transition: "all 0.2s",
            "&:focus-within": {
              bgcolor: "#fff",
              borderColor: "#c7d2fe",
              width: 300,
            },
          }}
        >
          <SearchIcon size={16} color="#94a3b8" />
          <InputBase
            placeholder="Search issues..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{ fontSize: "0.8rem", flex: 1, input: { py: 0 } }}
          />
        </Paper>

        {/* Stats */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            gap: 1,
          }}
        >
          <Chip
            size="small"
            label={`${counts.total} issues`}
            sx={{
              bgcolor: "#f1f5f9",
              color: "#475569",
              fontWeight: 500,
              fontSize: "0.72rem",
            }}
          />
          {counts.inProgress > 0 && (
            <Chip
              size="small"
              label={`${counts.inProgress} active`}
              sx={{
                bgcolor: "#fffbeb",
                color: "#d97706",
                fontWeight: 500,
                fontSize: "0.72rem",
              }}
            />
          )}
        </Box>

        {/* Member avatars */}
        <AvatarGroup
          max={4}
          sx={{
            display: { xs: "none", lg: "flex" },
            "& .MuiAvatar-root": {
              width: 28,
              height: 28,
              fontSize: "0.7rem",
              border: "2px solid #fff",
            },
          }}
        >
          {members.map((m) => (
            <AssigneeAvatar
              key={m.id}
              name={m.assignee_name!}
              initials={m.assignee_avatar}
              size={28}
            />
          ))}
        </AvatarGroup>

        <Button
          variant="contained"
          onClick={onCreateIssue}
          startIcon={<PlusIcon size={16} />}
          sx={{
            bgcolor: "#4f46e5",
            boxShadow: "none",
            "&:hover": { bgcolor: "#4338ca", boxShadow: "none" },
            borderRadius: 2,
            px: 2,
            py: 0.5,
            fontSize: "0.82rem",
          }}
        >
          Create
        </Button>

        {profile && <NotificationBell userId={profile.id} />}

        {profile && (
          <>
            <Tooltip title={profile.full_name ?? profile.email}>
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                sx={{ p: 0.25 }}
              >
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    fontSize: "0.75rem",
                    bgcolor: "#4f46e5",
                  }}
                >
                  {profile.avatar_initials ??
                    profile.email.slice(0, 2).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              open={!!userMenuAnchor}
              anchorEl={userMenuAnchor}
              onClose={() => setUserMenuAnchor(null)}
              slotProps={{
                paper: { sx: { borderRadius: 2, mt: 1, minWidth: 220 } },
              }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography sx={{ fontWeight: 600, fontSize: "0.85rem" }}>
                  {profile.full_name ?? profile.email}
                </Typography>
                <Typography sx={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                  {profile.email}
                </Typography>
                <Chip
                  size="small"
                  label={isAdmin ? "Admin" : "Member"}
                  sx={{
                    mt: 0.5,
                    height: 18,
                    fontSize: "0.65rem",
                    bgcolor: isAdmin ? "#eef2ff" : "#f1f5f9",
                    color: isAdmin ? "#4f46e5" : "#64748b",
                  }}
                />
              </Box>
              <Divider />
              {isAdmin && (
                <MenuItem
                  onClick={() => {
                    onOpenAdmin?.();
                    setUserMenuAnchor(null);
                  }}
                >
                  <ListItemIcon>
                    <SettingsIcon size={16} color="#475569" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Admin dashboard"
                    slotProps={{ primary: { sx: { fontSize: "0.82rem" } } }}
                  />
                </MenuItem>
              )}
              <MenuItem
                onClick={() => {
                  onSignOut?.();
                  setUserMenuAnchor(null);
                }}
                sx={{ color: "#dc2626" }}
              >
                <ListItemText
                  primary="Sign out"
                  slotProps={{ primary: { sx: { fontSize: "0.82rem" } } }}
                />
              </MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
