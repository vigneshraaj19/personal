import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  InputBase,
  Paper,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
  Avatar,
} from "@mui/material";

import { iconFor } from "@/lib/icons";
import { AssigneeAvatar } from "@/components/ui/Badges";
import type { Channel, ChatMessage, Profile } from "@/lib/types";

import { fetchAllProfiles } from "@/lib/auth-api";

import {
  fetchChannels,
  fetchAllChannelMembers,
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  togglePinMessage,
  createGroupChannel,
  getOrCreateDmChannel,
  subscribeToChannelMessages,
} from "@/lib/chat-api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function timeLabel(iso: string): string {
  const d = new Date(iso);

  return d.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderBody(body: string) {
  const parts = body.split(/(@\w+)/g);

  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <Box
        key={i}
        component="span"
        sx={{
          color: "#6366f1",
          fontWeight: 700,
          transition: "color 0.2s ease",
        }}
      >
        {part}
      </Box>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ChatView({
  currentUser,
  onBack,
}: {
  currentUser: Profile;
  onBack: () => void;
}) {
  /* ------------------------------------------------------------------------ */
  /* Icons                                                                    */
  /* ------------------------------------------------------------------------ */

  const HashIcon = iconFor("Hash");
  const UsersIcon = iconFor("Users");
  const PlusIcon = iconFor("Plus");
  const SearchIcon = iconFor("Search");
  const SendIcon = iconFor("Send");
  const PinIcon = iconFor("Pin");
  const PinOffIcon = iconFor("PinOff");
  const ReplyIcon = iconFor("CornerUpLeft");
  const PencilIcon = iconFor("Pencil");
  const TrashIcon = iconFor("Trash2");
  const XIcon = iconFor("X");
  const ArrowLeft = iconFor("ChevronRight");
  const SparklesIcon = iconFor("Sparkles");
  const MessageCircleIcon = iconFor("MessageCircle");
  const CommandIcon = iconFor("Command");
  const UserPlusIcon = iconFor("UserPlus");

  /* ------------------------------------------------------------------------ */
  /* State                                                                    */
  /* ------------------------------------------------------------------------ */

  const [channels, setChannels] = useState<Channel[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [memberMap, setMemberMap] = useState<Map<string, Set<string>>>(
    new Map(),
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(
    null,
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);

  const [messageInput, setMessageInput] = useState("");
  const [search, setSearch] = useState("");

  const [threadRootId, setThreadRootId] = useState<string | null>(null);
  const [threadInput, setThreadInput] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBody, setEditingBody] = useState("");

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);

  const [dmDialogOpen, setDmDialogOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------------------ */
  /* Load everything                                                          */
  /* ------------------------------------------------------------------------ */

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const [ch, profs, members] = await Promise.all([
        fetchChannels(),
        fetchAllProfiles(),
        fetchAllChannelMembers(),
      ]);

      setChannels(ch);
      setProfiles(profs);

      const map = new Map<string, Set<string>>();

      members.forEach((m) => {
        const set = map.get(m.channel_id) ?? new Set<string>();

        set.add(m.user_id);
        map.set(m.channel_id, set);
      });

      setMemberMap(map);

      setSelectedChannelId(
        (prev) =>
          prev ?? ch.find((c) => c.type === "team")?.id ?? ch[0]?.id ?? null,
      );
    } catch {
      setError("Failed to load chat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------------------------------------------------------------ */
  /* Load messages                                                            */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!selectedChannelId) {
      setMessages([]);
      return;
    }

    let active = true;

    setMessagesLoading(true);

    const refresh = () => {
      fetchMessages(selectedChannelId)
        .then((m) => {
          if (active) {
            setMessages(m);
          }
        })
        .catch(() => {
          if (active) {
            setError("Failed to load messages.");
          }
        })
        .finally(() => {
          if (active) {
            setMessagesLoading(false);
          }
        });
    };

    refresh();

    const unsubscribe = subscribeToChannelMessages(selectedChannelId, refresh);

    return () => {
      active = false;
      unsubscribe();
    };
  }, [selectedChannelId]);

  /* ------------------------------------------------------------------------ */
  /* Scroll                                                                    */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length, threadRootId]);

  /* ------------------------------------------------------------------------ */
  /* Derived values                                                           */
  /* ------------------------------------------------------------------------ */

  const profileById = useMemo(
    () => new Map(profiles.map((p) => [p.id, p])),
    [profiles],
  );

  function authorLabel(authorId: string | null): string {
    if (!authorId) return "Unknown";

    if (authorId === currentUser.id) {
      return "You";
    }

    const p = profileById.get(authorId);

    return p?.full_name ?? p?.email ?? "Unknown";
  }

  function displayName(c: Channel): string {
    if (c.type !== "dm") {
      return c.name;
    }

    const members = memberMap.get(c.id);

    const otherId = members
      ? [...members].find((id) => id !== currentUser.id)
      : undefined;

    const other = otherId ? profileById.get(otherId) : undefined;

    return other?.full_name ?? other?.email ?? c.name;
  }

  const grouped = useMemo(() => {
    const g: Record<Channel["type"], Channel[]> = {
      team: [],
      project: [],
      group: [],
      dm: [],
    };

    channels.forEach((c) => {
      g[c.type].push(c);
    });

    return g;
  }, [channels]);

  const selectedChannel =
    channels.find((c) => c.id === selectedChannelId) ?? null;

  const rootMessages = useMemo(
    () => messages.filter((m) => !m.parent_message_id),
    [messages],
  );

  const filteredRootMessages = useMemo(() => {
    if (!search.trim()) {
      return rootMessages;
    }

    const q = search.toLowerCase();

    return rootMessages.filter((m) => m.body.toLowerCase().includes(q));
  }, [rootMessages, search]);

  const pinnedMessages = useMemo(
    () => messages.filter((m) => m.pinned && !m.deleted_at),
    [messages],
  );

  const repliesOf = useCallback(
    (id: string) => messages.filter((m) => m.parent_message_id === id),
    [messages],
  );

  const threadRoot = threadRootId
    ? (messages.find((m) => m.id === threadRootId) ?? null)
    : null;

  const threadReplies = threadRootId ? repliesOf(threadRootId) : [];

  /* ------------------------------------------------------------------------ */
  /* Send message                                                             */
  /* ------------------------------------------------------------------------ */

  async function handleSend() {
    if (!messageInput.trim() || !selectedChannelId) {
      return;
    }

    const body = messageInput.trim();

    setMessageInput("");

    try {
      await sendMessage({
        channelId: selectedChannelId,
        authorId: currentUser.id,
        authorName: currentUser.full_name ?? currentUser.email,
        body,
      });
    } catch {
      setError("Failed to send message.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Thread reply                                                             */
  /* ------------------------------------------------------------------------ */

  async function handleSendThreadReply() {
    if (!threadInput.trim() || !selectedChannelId || !threadRootId) {
      return;
    }

    const body = threadInput.trim();

    setThreadInput("");

    try {
      await sendMessage({
        channelId: selectedChannelId,
        authorId: currentUser.id,
        authorName: currentUser.full_name ?? currentUser.email,
        body,
        parentMessageId: threadRootId,
      });
    } catch {
      setError("Failed to send reply.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Pin                                                                      */
  /* ------------------------------------------------------------------------ */

  async function handleTogglePin(m: ChatMessage) {
    setMessages((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              pinned: !x.pinned,
            }
          : x,
      ),
    );

    try {
      await togglePinMessage(m.id, !m.pinned);
    } catch {
      setError("Failed to update pin.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Delete                                                                    */
  /* ------------------------------------------------------------------------ */

  async function handleDelete(m: ChatMessage) {
    setMessages((prev) =>
      prev.map((x) =>
        x.id === m.id
          ? {
              ...x,
              deleted_at: new Date().toISOString(),
            }
          : x,
      ),
    );

    try {
      await deleteMessage(m.id);
    } catch {
      setError("Failed to delete message.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Edit                                                                      */
  /* ------------------------------------------------------------------------ */

  function startEdit(m: ChatMessage) {
    setEditingId(m.id);
    setEditingBody(m.body);
  }

  async function saveEdit() {
    if (!editingId) {
      return;
    }

    const id = editingId;
    const body = editingBody.trim();

    setEditingId(null);

    if (!body) {
      return;
    }

    setMessages((prev) =>
      prev.map((x) =>
        x.id === id
          ? {
              ...x,
              body,
              edited_at: new Date().toISOString(),
            }
          : x,
      ),
    );

    try {
      await editMessage(id, body);
    } catch {
      setError("Failed to save edit.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Group chat                                                                */
  /* ------------------------------------------------------------------------ */

  async function handleCreateGroup() {
    if (!groupName.trim()) {
      return;
    }

    try {
      const c = await createGroupChannel(
        groupName.trim(),
        groupMemberIds,
        currentUser.id,
      );

      setGroupDialogOpen(false);
      setGroupName("");
      setGroupMemberIds([]);

      await load();

      setSelectedChannelId(c.id);
    } catch {
      setError("Failed to create group chat.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* DM                                                                        */
  /* ------------------------------------------------------------------------ */

  async function handleStartDm(other: Profile) {
    try {
      const c = await getOrCreateDmChannel(
        currentUser.id,
        other.id,
        other.full_name ?? other.email,
      );

      setDmDialogOpen(false);

      await load();

      setSelectedChannelId(c.id);
    } catch {
      setError("Failed to open direct message.");
    }
  }

  /* ------------------------------------------------------------------------ */
  /* Channel row                                                               */
  /* ------------------------------------------------------------------------ */

  function renderChannelRow(c: Channel) {
    const isActive = c.id === selectedChannelId;

    const Icon =
      c.type === "dm" ? null : c.type === "group" ? UsersIcon : HashIcon;

    const other =
      c.type === "dm"
        ? profileById.get(
            [...(memberMap.get(c.id) ?? [])].find(
              (id) => id !== currentUser.id,
            ) ?? "",
          )
        : null;

    return (
      <ListItemButton
        key={c.id}
        selected={isActive}
        onClick={() => {
          setSelectedChannelId(c.id);
          setThreadRootId(null);
          setSearch("");
        }}
        sx={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "12px",
          mb: 0.5,
          py: 0.85,
          px: 1.25,
          color: "#94a3b8",

          transition:
            "background-color 220ms ease, transform 220ms ease, color 220ms ease",

          "&:hover": {
            bgcolor: "rgba(255,255,255,0.055)",
            transform: "translateX(3px)",
          },

          "&.Mui-selected": {
            bgcolor:
              "linear-gradient(90deg, rgba(99,102,241,0.28), rgba(99,102,241,0.08))",
            color: "#fff",
          },

          "&.Mui-selected:hover": {
            bgcolor: "rgba(99,102,241,0.23)",
          },

          "&::before": isActive
            ? {
                content: '""',
                position: "absolute",
                left: 0,
                top: 7,
                bottom: 7,
                width: 3,
                borderRadius: 10,
                bgcolor: "#818cf8",
                boxShadow: "0 0 14px rgba(129,140,248,0.9)",
              }
            : {},
        }}
      >
        {Icon ? (
          <Icon
            size={15}
            color={isActive ? "#a5b4fc" : "#64748b"}
            style={{
              marginRight: 9,
              flexShrink: 0,
            }}
          />
        ) : (
          <Box
            sx={{
              mr: 1,
              flexShrink: 0,
            }}
          >
            <AssigneeAvatar
              name={other?.full_name ?? other?.email ?? null}
              initials={other?.avatar_initials}
              size={21}
            />
          </Box>
        )}

        <ListItemText
          primary={displayName(c)}
          slotProps={{
            primary: {
              sx: {
                fontSize: "0.8rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#eef2ff" : "#94a3b8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            },
          }}
        />
      </ListItemButton>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Message row                                                               */
  /* ------------------------------------------------------------------------ */

  function MessageRow({ m, inThread }: { m: ChatMessage; inThread?: boolean }) {
    const isMine = m.author_id === currentUser.id;

    const isEditing = editingId === m.id;

    const replyCount = inThread ? 0 : repliesOf(m.id).length;

    if (m.deleted_at) {
      return (
        <Box
          sx={{
            display: "flex",
            gap: 1.25,
            py: 1,
            px: 0.75,
            animation: "messageAppear 350ms ease",
          }}
        >
          <AssigneeAvatar name={authorLabel(m.author_id)} size={30} />

          <Typography
            sx={{
              fontSize: "0.8rem",
              color: "#94a3b8",
              fontStyle: "italic",
              pt: 0.5,
            }}
          >
            Message deleted
          </Typography>
        </Box>
      );
    }

    return (
      <Box
        sx={{
          display: "flex",
          gap: 1.25,
          py: 0.8,
          px: 0.75,
          borderRadius: "14px",

          animation: "messageAppear 320ms cubic-bezier(.2,.8,.2,1)",

          transition: "background-color 180ms ease, transform 180ms ease",

          "&:hover": {
            bgcolor: "rgba(248,250,252,0.85)",
            transform: "translateX(2px)",
          },

          "&:hover .msg-actions": {
            opacity: 1,
            transform: "translateX(0)",
          },
        }}
      >
        <Box
          sx={{
            pt: 0.2,
            flexShrink: 0,
          }}
        >
          <AssigneeAvatar name={authorLabel(m.author_id)} size={31} />
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              gap: 0.8,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.81rem",
                fontWeight: 750,
                color: isMine ? "#4338ca" : "#1e293b",
              }}
            >
              {authorLabel(m.author_id)}
            </Typography>

            <Typography
              sx={{
                fontSize: "0.65rem",
                color: "#94a3b8",
              }}
            >
              {timeLabel(m.created_at)}
            </Typography>

            {m.edited_at && (
              <Typography
                sx={{
                  fontSize: "0.62rem",
                  color: "#cbd5e1",
                }}
              >
                edited
              </Typography>
            )}

            {m.pinned && <PinIcon size={11} color="#d97706" />}
          </Box>

          {isEditing ? (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 0.75,
              }}
            >
              <TextField
                size="small"
                fullWidth
                value={editingBody}
                onChange={(e) => setEditingBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    saveEdit();
                  }

                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
                autoFocus
              />

              <Button
                size="small"
                onClick={saveEdit}
                sx={{
                  borderRadius: 2,
                }}
              >
                Save
              </Button>

              <Button
                size="small"
                onClick={() => setEditingId(null)}
                sx={{
                  color: "#64748b",
                }}
              >
                Cancel
              </Button>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: "0.86rem",
                lineHeight: 1.6,
                color: "#334155",
                wordBreak: "break-word",
                mt: 0.1,
              }}
            >
              {renderBody(m.body)}
            </Typography>
          )}

          {!inThread && replyCount > 0 && (
            <Button
              size="small"
              onClick={() => setThreadRootId(m.id)}
              sx={{
                fontSize: "0.7rem",
                textTransform: "none",
                color: "#4f46e5",
                mt: 0.25,
                p: 0,
                minWidth: 0,
                "&:hover": {
                  bgcolor: "transparent",
                  color: "#312e81",
                },
              }}
            >
              {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </Button>
          )}
        </Box>

        {!isEditing && (
          <Box
            className="msg-actions"
            sx={{
              opacity: 0,
              transform: "translateX(5px)",
              display: "flex",
              gap: 0.25,
              alignSelf: "flex-start",

              transition: "opacity 180ms ease, transform 180ms ease",

              bgcolor: "rgba(255,255,255,0.94)",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              p: 0.25,
              boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
            }}
          >
            {!inThread && (
              <Tooltip title="Reply">
                <IconButton size="small" onClick={() => setThreadRootId(m.id)}>
                  <ReplyIcon size={14} color="#64748b" />
                </IconButton>
              </Tooltip>
            )}

            <Tooltip title={m.pinned ? "Unpin" : "Pin"}>
              <IconButton size="small" onClick={() => handleTogglePin(m)}>
                {m.pinned ? (
                  <PinOffIcon size={14} color="#64748b" />
                ) : (
                  <PinIcon size={14} color="#64748b" />
                )}
              </IconButton>
            </Tooltip>

            {isMine && (
              <>
                <Tooltip title="Edit">
                  <IconButton size="small" onClick={() => startEdit(m)}>
                    <PencilIcon size={14} color="#64748b" />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
                  <IconButton size="small" onClick={() => handleDelete(m)}>
                    <TrashIcon size={14} color="#dc2626" />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      </Box>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Empty state                                                              */
  /* ------------------------------------------------------------------------ */

  function EmptyChatState() {
    return (
      <Box
        sx={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          background:
            "radial-gradient(circle at 50% 40%, rgba(99,102,241,0.10), transparent 35%), linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        }}
      >
        {/* Animated background orbs */}
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            bgcolor: "rgba(99,102,241,0.08)",
            filter: "blur(50px)",
            top: "-100px",
            left: "20%",
            animation: "floatOrb 8s ease-in-out infinite",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            bgcolor: "rgba(139,92,246,0.07)",
            filter: "blur(50px)",
            right: "10%",
            bottom: "-80px",
            animation: "floatOrb 10s ease-in-out infinite reverse",
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            textAlign: "center",
            maxWidth: 540,
            animation: "emptyAppear 650ms cubic-bezier(.2,.8,.2,1)",
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: 82,
              height: 82,
              borderRadius: "26px",
              margin: "0 auto 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "linear-gradient(135deg, #4f46e5, #7c3aed)",

              boxShadow:
                "0 20px 50px rgba(79,70,229,0.28), inset 0 1px rgba(255,255,255,0.25)",

              animation: "iconFloat 4s ease-in-out infinite",
            }}
          >
            <MessageCircleIcon size={36} color="#fff" />
          </Box>

          <Typography
            sx={{
              fontSize: {
                xs: "1.5rem",
                md: "2rem",
              },
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#0f172a",
              mb: 1,
            }}
          >
            Your workspace conversations
          </Typography>

          <Typography
            sx={{
              color: "#64748b",
              fontSize: "0.92rem",
              lineHeight: 1.7,
              maxWidth: 450,
              mx: "auto",
              mb: 3,
            }}
          >
            Select a channel from the left to jump into the conversation, or
            start a new direct message with your team.
          </Typography>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 1.5,
                py: 0.9,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(148,163,184,0.18)",
                color: "#64748b",
                fontSize: "0.75rem",
              }}
            >
              <SparklesIcon size={14} color="#6366f1" />
              Fast conversations
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 1.5,
                py: 0.9,
                borderRadius: "12px",
                bgcolor: "rgba(255,255,255,0.75)",
                border: "1px solid rgba(148,163,184,0.18)",
                color: "#64748b",
                fontSize: "0.75rem",
              }}
            >
              <UsersIcon size={14} color="#8b5cf6" />
              Team collaboration
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Loading                                                                  */
  /* ------------------------------------------------------------------------ */

  if (loading) {
    return (
      <Box
        sx={{
          height: "100dvh",
          minHeight: 0,
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f8fafc",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              bgcolor: "#4f46e5",
              boxShadow: "0 12px 30px rgba(79,70,229,0.25)",
              animation: "iconFloat 2s ease-in-out infinite",
            }}
          >
            <MessageCircleIcon size={23} color="#fff" />
          </Box>

          <CircularProgress
            size={20}
            sx={{
              color: "#4f46e5",
            }}
          />
        </Box>
      </Box>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* Main UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <Box
      sx={{
        /*
         * IMPORTANT:
         * The old version used height: 100%.
         * That caused the component to stop at the height
         * of its parent and created the giant white area.
         */
        height: "100dvh",
        minHeight: 0,
        width: "100%",
        display: "flex",
        overflow: "hidden",

        bgcolor: "#f8fafc",

        position: "relative",

        "& *": {
          boxSizing: "border-box",
        },

        "@keyframes messageAppear": {
          from: {
            opacity: 0,
            transform: "translateY(8px)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0)",
          },
        },

        "@keyframes emptyAppear": {
          from: {
            opacity: 0,
            transform: "translateY(20px) scale(0.98)",
          },
          to: {
            opacity: 1,
            transform: "translateY(0) scale(1)",
          },
        },

        "@keyframes iconFloat": {
          "0%, 100%": {
            transform: "translateY(0px)",
          },
          "50%": {
            transform: "translateY(-7px)",
          },
        },

        "@keyframes floatOrb": {
          "0%, 100%": {
            transform: "translate3d(0, 0, 0) scale(1)",
          },
          "50%": {
            transform: "translate3d(20px, -25px, 0) scale(1.08)",
          },
        },

        "@keyframes pulseGlow": {
          "0%, 100%": {
            boxShadow: "0 0 0 rgba(99,102,241,0)",
          },
          "50%": {
            boxShadow: "0 0 28px rgba(99,102,241,0.25)",
          },
        },

        "@media (prefers-reduced-motion: reduce)": {
          "& *": {
            animationDuration: "0.01ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "0.01ms !important",
          },
        },
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* SIDEBAR                                                            */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          width: {
            xs: 230,
            md: 285,
          },

          flexShrink: 0,
          height: "100%",
          minHeight: 0,

          display: "flex",
          flexDirection: "column",

          bgcolor: "#080d1d",

          color: "#cbd5e1",

          position: "relative",
          overflow: "hidden",

          borderRight: "1px solid rgba(148,163,184,0.08)",

          boxShadow: "10px 0 40px rgba(15,23,42,0.08)",

          "&::before": {
            content: '""',
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "rgba(79,70,229,0.14)",
            filter: "blur(70px)",
            top: -150,
            left: -120,
            pointerEvents: "none",
          },

          "&::after": {
            content: '""',
            position: "absolute",
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "rgba(124,58,237,0.09)",
            filter: "blur(70px)",
            bottom: -120,
            right: -100,
            pointerEvents: "none",
          },
        }}
      >
        {/* Sidebar top */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            px: 1.5,
            pt: 1.5,
            pb: 1,
          }}
        >
          <Box
            sx={{
              height: 48,
              px: 1.25,

              display: "flex",
              alignItems: "center",
              gap: 1,

              borderRadius: "15px",

              background:
                "linear-gradient(135deg, rgba(99,102,241,0.26), rgba(79,70,229,0.08))",

              border: "1px solid rgba(129,140,248,0.18)",

              boxShadow: "inset 0 1px rgba(255,255,255,0.06)",

              animation: "pulseGlow 4s ease-in-out infinite",
            }}
          >
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                width: 30,
                height: 30,
                color: "#818cf8",
                transform: "rotate(180deg)",
                borderRadius: "9px",
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.07)",
                  color: "#c7d2fe",
                },
              }}
            >
              <ArrowLeft size={16} />
            </IconButton>

            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "9px",
                bgcolor: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 5px 16px rgba(79,70,229,0.35)",
              }}
            >
              <HashIcon size={15} color="#fff" />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "#f8fafc",
                letterSpacing: "-0.01em",
              }}
            >
              ER Chat
            </Typography>

            <Box
              sx={{
                ml: "auto",
                width: 7,
                height: 7,
                borderRadius: "50%",
                bgcolor: "#818cf8",
                boxShadow: "0 0 12px rgba(129,140,248,0.9)",
              }}
            />
          </Box>
        </Box>

        {/* Sidebar content */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: 1.5,
            pb: 2,

            "&::-webkit-scrollbar": {
              width: 4,
            },

            "&::-webkit-scrollbar-thumb": {
              background: "rgba(148,163,184,0.15)",
              borderRadius: 10,
            },
          }}
        >
          {/* Team */}
          {grouped.team.length > 0 && (
            <>
              <Typography
                sx={{
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  px: 1.25,
                  mt: 1.5,
                  mb: 0.7,
                }}
              >
                Team
              </Typography>

              <List dense disablePadding>
                {grouped.team.map(renderChannelRow)}
              </List>
            </>
          )}

          {/* Projects */}
          {grouped.project.length > 0 && (
            <>
              <Typography
                sx={{
                  fontSize: "0.64rem",
                  fontWeight: 800,
                  color: "#475569",
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  px: 1.25,
                  mt: 2,
                  mb: 0.7,
                }}
              >
                Projects
              </Typography>

              <List dense disablePadding>
                {grouped.project.map(renderChannelRow)}
              </List>
            </>
          )}

          {/* Groups */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.25,
              mt: 2,
              mb: 0.7,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.64rem",
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Group chats
            </Typography>

            <Tooltip title="New group chat">
              <IconButton
                size="small"
                onClick={() => setGroupDialogOpen(true)}
                sx={{
                  width: 23,
                  height: 23,
                  color: "#64748b",
                  borderRadius: "7px",

                  "&:hover": {
                    color: "#c7d2fe",
                    bgcolor: "rgba(99,102,241,0.12)",
                  },
                }}
              >
                <PlusIcon size={13} />
              </IconButton>
            </Tooltip>
          </Box>

          <List dense disablePadding>
            {grouped.group.map(renderChannelRow)}
          </List>

          {/* DMs */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              px: 1.25,
              mt: 2,
              mb: 0.7,
            }}
          >
            <Typography
              sx={{
                fontSize: "0.64rem",
                fontWeight: 800,
                color: "#475569",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Direct messages
            </Typography>

            <Tooltip title="New direct message">
              <IconButton
                size="small"
                onClick={() => setDmDialogOpen(true)}
                sx={{
                  width: 23,
                  height: 23,
                  color: "#64748b",
                  borderRadius: "7px",

                  "&:hover": {
                    color: "#c7d2fe",
                    bgcolor: "rgba(99,102,241,0.12)",
                  },
                }}
              >
                <PlusIcon size={13} />
              </IconButton>
            </Tooltip>
          </Box>

          <List dense disablePadding>
            {grouped.dm.map(renderChannelRow)}
          </List>

          {/* No channels */}
          {channels.length === 0 && (
            <Box
              sx={{
                px: 1.5,
                py: 4,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  mx: "auto",
                  mb: 1.5,
                  borderRadius: "13px",
                  bgcolor: "rgba(99,102,241,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircleIcon size={19} color="#6366f1" />
              </Box>

              <Typography
                sx={{
                  fontSize: "0.74rem",
                  color: "#64748b",
                  lineHeight: 1.5,
                }}
              >
                No conversations yet
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN AREA                                                          */}
      {/* ------------------------------------------------------------------ */}

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          height: "100%",
          display: "flex",
          overflow: "hidden",

          bgcolor: "#f8fafc",

          position: "relative",
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* -------------------------------------------------------------- */}
          {/* No channel selected                                            */}
          {/* -------------------------------------------------------------- */}

          {!selectedChannel ? (
            <EmptyChatState />
          ) : (
            <>
              {/* ---------------------------------------------------------- */}
              {/* Header                                                     */}
              {/* ---------------------------------------------------------- */}

              <Box
                sx={{
                  flexShrink: 0,
                  minHeight: 70,
                  px: {
                    xs: 2,
                    md: 3,
                  },
                  py: 1.5,

                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,

                  bgcolor: "rgba(255,255,255,0.82)",

                  backdropFilter: "blur(18px)",

                  borderBottom: "1px solid rgba(226,232,240,0.85)",

                  boxShadow: "0 4px 20px rgba(15,23,42,0.035)",

                  zIndex: 5,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: "12px",
                    bgcolor:
                      selectedChannel.type === "dm"
                        ? "rgba(139,92,246,0.12)"
                        : "rgba(79,70,229,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedChannel.type === "dm" ? (
                    <MessageCircleIcon size={18} color="#8b5cf6" />
                  ) : (
                    <HashIcon size={18} color="#6366f1" />
                  )}
                </Box>

                <Box
                  sx={{
                    minWidth: 0,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 800,
                      fontSize: "0.95rem",
                      color: "#0f172a",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {displayName(selectedChannel)}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.67rem",
                      color: "#94a3b8",
                      mt: 0.15,
                    }}
                  >
                    {selectedChannel.type === "dm"
                      ? "Private conversation"
                      : "Workspace channel"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    ml: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      width: {
                        xs: 150,
                        sm: 220,
                        md: 260,
                      },

                      height: 36,

                      display: "flex",
                      alignItems: "center",

                      bgcolor: "#f1f5f9",

                      border: "1px solid #e2e8f0",

                      borderRadius: "11px",

                      px: 1.2,
                      gap: 0.7,

                      transition: "all 200ms ease",

                      "&:focus-within": {
                        bgcolor: "#fff",
                        borderColor: "#a5b4fc",
                        boxShadow: "0 0 0 3px rgba(99,102,241,0.08)",
                      },
                    }}
                  >
                    <SearchIcon size={14} color="#94a3b8" />

                    <InputBase
                      placeholder="Search messages..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      sx={{
                        fontSize: "0.74rem",
                        flex: 1,

                        input: {
                          py: 0,
                        },
                      }}
                    />
                  </Paper>
                </Box>
              </Box>

              {/* ---------------------------------------------------------- */}
              {/* Pinned                                                     */}
              {/* ---------------------------------------------------------- */}

              {pinnedMessages.length > 0 && (
                <Box
                  sx={{
                    flexShrink: 0,
                    px: 3,
                    py: 0.8,

                    display: "flex",
                    alignItems: "center",
                    gap: 1,

                    bgcolor: "rgba(255,251,235,0.9)",

                    borderBottom: "1px solid #fef3c7",

                    overflowX: "auto",
                  }}
                >
                  <PinIcon size={13} color="#d97706" />

                  {pinnedMessages.map((m) => (
                    <Box
                      key={m.id}
                      sx={{
                        px: 1,
                        py: 0.35,
                        borderRadius: "7px",
                        bgcolor: "rgba(245,158,11,0.08)",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.69rem",
                          color: "#92400e",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {authorLabel(m.author_id)}: {m.body.slice(0, 70)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* ---------------------------------------------------------- */}
              {/* Messages                                                   */}
              {/* ---------------------------------------------------------- */}

              <Box
                sx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  px: {
                    xs: 1,
                    md: 2.5,
                  },
                  py: 1.5,

                  background:
                    "radial-gradient(circle at 20% 0%, rgba(99,102,241,0.035), transparent 28%), #f8fafc",

                  "&::-webkit-scrollbar": {
                    width: 6,
                  },

                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(148,163,184,0.22)",
                    borderRadius: 10,
                  },
                }}
              >
                {messagesLoading ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                    }}
                  >
                    <CircularProgress
                      size={22}
                      sx={{
                        color: "#4f46e5",
                      }}
                    />
                  </Box>
                ) : filteredRootMessages.length === 0 ? (
                  <Box
                    sx={{
                      minHeight: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                    }}
                  >
                    <Box
                      sx={{
                        animation: "emptyAppear 450ms ease",
                      }}
                    >
                      <Box
                        sx={{
                          width: 58,
                          height: 58,
                          mx: "auto",
                          mb: 1.5,
                          borderRadius: "18px",
                          bgcolor: "rgba(99,102,241,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MessageCircleIcon size={24} color="#6366f1" />
                      </Box>

                      <Typography
                        sx={{
                          fontWeight: 750,
                          fontSize: "0.9rem",
                          color: "#334155",
                        }}
                      >
                        Start the conversation
                      </Typography>

                      <Typography
                        sx={{
                          fontSize: "0.76rem",
                          color: "#94a3b8",
                          mt: 0.5,
                        }}
                      >
                        Send the first message to this channel.
                      </Typography>
                    </Box>
                  </Box>
                ) : (
                  filteredRootMessages.map((m) => (
                    <MessageRow key={m.id} m={m} />
                  ))
                )}

                <div ref={bottomRef} />
              </Box>

              {/* ---------------------------------------------------------- */}
              {/* Composer                                                    */}
              {/* ---------------------------------------------------------- */}

              <Box
                sx={{
                  flexShrink: 0,
                  px: {
                    xs: 1.5,
                    md: 2.5,
                  },
                  pt: 1.2,
                  pb: 1.5,

                  bgcolor: "rgba(255,255,255,0.92)",

                  backdropFilter: "blur(18px)",

                  borderTop: "1px solid rgba(226,232,240,0.9)",
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: 56,

                    px: 1,

                    borderRadius: "18px",

                    bgcolor: "#fff",

                    border: "1px solid #dbe3ef",

                    boxShadow: "0 10px 30px rgba(15,23,42,0.055)",

                    transition: "all 220ms ease",

                    "&:focus-within": {
                      borderColor: "#818cf8",
                      boxShadow:
                        "0 0 0 4px rgba(99,102,241,0.08), 0 10px 30px rgba(15,23,42,0.06)",
                    },
                  }}
                >
                  <InputBase
                    fullWidth
                    multiline
                    maxRows={5}
                    placeholder="Write a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    sx={{
                      flex: 1,
                      px: 1.2,
                      py: 1,
                      fontSize: "0.85rem",

                      "& textarea::placeholder": {
                        color: "#94a3b8",
                        opacity: 1,
                      },
                    }}
                  />

                  <IconButton
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                    sx={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,

                      color: "#fff",

                      bgcolor: messageInput.trim() ? "#4f46e5" : "#e2e8f0",

                      boxShadow: messageInput.trim()
                        ? "0 7px 20px rgba(79,70,229,0.3)"
                        : "none",

                      transition: "all 200ms ease",

                      "&:hover": {
                        bgcolor: messageInput.trim() ? "#4338ca" : "#e2e8f0",

                        transform: messageInput.trim()
                          ? "scale(1.06) rotate(-5deg)"
                          : "none",
                      },
                    }}
                  >
                    <SendIcon size={17} />
                  </IconButton>
                </Paper>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.5,
                    mt: 0.65,
                    px: 1,
                  }}
                >
                  <CommandIcon size={11} color="#cbd5e1" />

                  <Typography
                    sx={{
                      fontSize: "0.61rem",
                      color: "#b4c0cf",
                    }}
                  >
                    Enter to send
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.61rem",
                      color: "#cbd5e1",
                    }}
                  >
                    •
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.61rem",
                      color: "#b4c0cf",
                    }}
                  >
                    Shift + Enter for new line
                  </Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>

        {/* ---------------------------------------------------------------- */}
        {/* THREAD                                                           */}
        {/* ---------------------------------------------------------------- */}

        {threadRoot && (
          <Box
            sx={{
              width: {
                xs: 300,
                md: 360,
              },

              flexShrink: 0,

              height: "100%",

              borderLeft: "1px solid #e2e8f0",

              bgcolor: "#fff",

              display: "flex",
              flexDirection: "column",

              animation: "threadAppear 280ms cubic-bezier(.2,.8,.2,1)",

              "@keyframes threadAppear": {
                from: {
                  opacity: 0,
                  transform: "translateX(20px)",
                },
                to: {
                  opacity: 1,
                  transform: "translateX(0)",
                },
              },
            }}
          >
            {/* Thread header */}
            <Box
              sx={{
                px: 2,
                py: 1.5,

                minHeight: 66,

                borderBottom: "1px solid #e2e8f0",

                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",

                bgcolor: "rgba(255,255,255,0.92)",
              }}
            >
              <Box>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.85rem",
                    color: "#0f172a",
                  }}
                >
                  Thread
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.65rem",
                    color: "#94a3b8",
                    mt: 0.15,
                  }}
                >
                  Conversation replies
                </Typography>
              </Box>

              <IconButton
                size="small"
                onClick={() => setThreadRootId(null)}
                sx={{
                  borderRadius: "9px",
                  "&:hover": {
                    bgcolor: "#f1f5f9",
                  },
                }}
              >
                <XIcon size={15} />
              </IconButton>
            </Box>

            {/* Thread messages */}
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                px: 1.5,
                py: 1.5,

                "&::-webkit-scrollbar": {
                  width: 5,
                },

                "&::-webkit-scrollbar-thumb": {
                  background: "#e2e8f0",
                  borderRadius: 10,
                },
              }}
            >
              <Box
                sx={{
                  bgcolor: "rgba(99,102,241,0.035)",
                  border: "1px solid rgba(99,102,241,0.08)",
                  borderRadius: "14px",
                  p: 0.5,
                }}
              >
                <MessageRow m={threadRoot} inThread />
              </Box>

              <Divider
                sx={{
                  my: 1.5,
                }}
              />

              {threadReplies.length === 0 ? (
                <Box
                  sx={{
                    py: 5,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "0.76rem",
                      color: "#94a3b8",
                    }}
                  >
                    No replies yet.
                  </Typography>
                </Box>
              ) : (
                threadReplies.map((m) => (
                  <MessageRow key={m.id} m={m} inThread />
                ))
              )}
            </Box>

            {/* Thread composer */}
            <Box
              sx={{
                px: 1.5,
                py: 1.25,

                borderTop: "1px solid #e2e8f0",

                bgcolor: "#fff",
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  display: "flex",
                  alignItems: "center",

                  borderRadius: "13px",

                  border: "1px solid #dbe3ef",

                  px: 0.5,

                  transition: "all 180ms ease",

                  "&:focus-within": {
                    borderColor: "#818cf8",
                    boxShadow: "0 0 0 3px rgba(99,102,241,0.07)",
                  },
                }}
              >
                <InputBase
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Reply..."
                  value={threadInput}
                  onChange={(e) => setThreadInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendThreadReply();
                    }
                  }}
                  sx={{
                    fontSize: "0.78rem",
                    px: 1,
                    py: 0.75,
                  }}
                />

                <IconButton
                  size="small"
                  onClick={handleSendThreadReply}
                  disabled={!threadInput.trim()}
                  sx={{
                    width: 34,
                    height: 34,
                    bgcolor: threadInput.trim() ? "#4f46e5" : "#e2e8f0",
                    color: "#fff",
                    "&:hover": {
                      bgcolor: threadInput.trim() ? "#4338ca" : "#e2e8f0",
                    },
                  }}
                >
                  <SendIcon size={14} />
                </IconButton>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>

      {/* ------------------------------------------------------------------ */}
      {/* GROUP DIALOG                                                       */}
      {/* ------------------------------------------------------------------ */}

      <Dialog
        open={groupDialogOpen}
        onClose={() => setGroupDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1rem",
            pb: 1,
          }}
        >
          Create a group chat
        </DialogTitle>

        <DialogContent
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            pt: 1,
          }}
        >
          <TextField
            label="Group name"
            size="small"
            fullWidth
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "#94a3b8",
              mt: 0.5,
              fontWeight: 600,
            }}
          >
            Select members
          </Typography>

          <Box
            sx={{
              maxHeight: 240,
              overflowY: "auto",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              p: 0.5,
            }}
          >
            {profiles
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <ListItemButton
                  key={p.id}
                  dense
                  onClick={() =>
                    setGroupMemberIds((prev) =>
                      prev.includes(p.id)
                        ? prev.filter((id) => id !== p.id)
                        : [...prev, p.id],
                    )
                  }
                  sx={{
                    borderRadius: "9px",
                    mb: 0.25,
                  }}
                >
                  <Checkbox
                    size="small"
                    checked={groupMemberIds.includes(p.id)}
                    sx={{
                      p: 0.5,
                      mr: 1,
                    }}
                  />

                  <ListItemText
                    primary={p.full_name ?? p.email}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.8rem",
                          fontWeight: 600,
                        },
                      },
                    }}
                  />
                </ListItemButton>
              ))}
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            pt: 0.5,
          }}
        >
          <Button
            onClick={() => setGroupDialogOpen(false)}
            sx={{
              color: "#64748b",
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={handleCreateGroup}
            disabled={!groupName.trim()}
            sx={{
              bgcolor: "#4f46e5",
              "&:hover": {
                bgcolor: "#4338ca",
              },
              borderRadius: "10px",
              px: 2,
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* DM DIALOG                                                          */}
      {/* ------------------------------------------------------------------ */}

      <Dialog
        open={dmDialogOpen}
        onClose={() => setDmDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 30px 80px rgba(15,23,42,0.22)",
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 800,
            fontSize: "1rem",
          }}
        >
          New direct message
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 0.5,
          }}
        >
          <List dense>
            {profiles
              .filter((p) => p.id !== currentUser.id)
              .map((p) => (
                <ListItemButton
                  key={p.id}
                  onClick={() => handleStartDm(p)}
                  sx={{
                    borderRadius: "11px",
                    mb: 0.25,

                    transition: "all 160ms ease",

                    "&:hover": {
                      bgcolor: "rgba(99,102,241,0.07)",
                      transform: "translateX(3px)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      mr: 1.25,
                    }}
                  >
                    <AssigneeAvatar
                      name={p.full_name ?? p.email}
                      initials={p.avatar_initials}
                      size={30}
                    />
                  </Box>

                  <ListItemText
                    primary={p.full_name ?? p.email}
                    secondary={p.email}
                    slotProps={{
                      primary: {
                        sx: {
                          fontSize: "0.8rem",
                          fontWeight: 700,
                        },
                      },
                      secondary: {
                        sx: {
                          fontSize: "0.69rem",
                        },
                      },
                    }}
                  />

                  <UserPlusIcon size={15} color="#94a3b8" />
                </ListItemButton>
              ))}

            {profiles.length <= 1 && (
              <Typography
                sx={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  textAlign: "center",
                  py: 3,
                }}
              >
                No other users yet.
              </Typography>
            )}
          </List>
        </DialogContent>
      </Dialog>

      {/* ------------------------------------------------------------------ */}
      {/* ERROR                                                               */}
      {/* ------------------------------------------------------------------ */}

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{
            borderRadius: "12px",
            boxShadow: "0 12px 30px rgba(15,23,42,0.15)",
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}
