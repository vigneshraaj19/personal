import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Tabs,
  Tab,
  IconButton,
  InputAdornment,
  Divider,
  Fade,
  Slide,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  ArrowForward,
  CheckCircle,
} from "@mui/icons-material";

import { signIn, signUp } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";
import { iconFor } from "@/lib/icons";

export default function LoginPage() {
  const { setCurrentUser } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const LayersIcon = iconFor("layers");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError(null);
    setInfo(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const profile = await signIn(email, password);
        setCurrentUser(profile);
      } else {
        const profile = await signUp(
          email,
          password,
          fullName || email.split("@")[0],
        );

        setCurrentUser(profile);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const switchMode = (value: "signin" | "signup") => {
    if (value === mode) return;

    setError(null);
    setInfo(null);
    setMode(value);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, md: 4 },
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #eef2ff 0%, #f8fafc 45%, #eef2ff 100%)",
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: "absolute",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(79,70,229,0.18), rgba(99,102,241,0.04))",
          top: -250,
          right: -180,
        }}
      />

      <Box
        sx={{
          position: "absolute",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.02))",
          bottom: -220,
          left: -180,
        }}
      />

      {/* Main card */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1000,
          minHeight: { xs: "auto", md: 610 },
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          overflow: "hidden",
          borderRadius: 5,
          border: "1px solid rgba(226,232,240,0.9)",
          boxShadow: "0 30px 80px rgba(15,23,42,0.12)",
          position: "relative",
          zIndex: 1,
          background: "#fff",
        }}
      >
        {/* LEFT SIDE */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            justifyContent: "space-between",
            p: 6,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            background:
              "linear-gradient(145deg, #312e81 0%, #4f46e5 48%, #6366f1 100%)",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 320,
              height: 320,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              top: -120,
              right: -120,
            }}
          />

          <Box
            sx={{
              position: "absolute",
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.1)",
              bottom: -80,
              left: -80,
            }}
          />

          {/* Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              position: "relative",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                background: "rgba(255,255,255,0.16)",
                backdropFilter: "blur(10px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.2)",
              }}
            >
              <LayersIcon size={23} color="#fff" strokeWidth={2} />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.2rem",
                letterSpacing: "-0.02em",
              }}
            >
              Vicky Stack
            </Typography>
          </Box>

          {/* Hero */}
          <Box sx={{ position: "relative", maxWidth: 390 }}>
            <Typography
              sx={{
                fontSize: "2.7rem",
                lineHeight: 1.1,
                fontWeight: 800,
                letterSpacing: "-0.04em",
                mb: 2.5,
              }}
            >
              Build. Ship.
              <br />
              <Box component="span" sx={{ opacity: 0.65 }}>
                Scale.
              </Box>
            </Typography>

            <Typography
              sx={{
                color: "rgba(255,255,255,0.72)",
                fontSize: "1rem",
                lineHeight: 1.7,
                mb: 4,
              }}
            >
              A simple workspace to manage your projects, track your work, and
              keep everything moving forward.
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.5,
              }}
            >
              {[
                "Manage projects effortlessly",
                "Track your team's progress",
                "Everything in one workspace",
              ].map((item) => (
                <Box
                  key={item}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                  }}
                >
                  <CheckCircle
                    sx={{
                      fontSize: 19,
                      color: "rgba(255,255,255,0.9)",
                    }}
                  />

                  <Typography
                    sx={{
                      fontSize: "0.88rem",
                      color: "rgba(255,255,255,0.82)",
                    }}
                  >
                    {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          <Typography
            sx={{
              fontSize: "0.72rem",
              color: "rgba(255,255,255,0.45)",
              position: "relative",
            }}
          >
            © 2026 Vicky Stack. All rights reserved.
          </Typography>
        </Box>

        {/* RIGHT SIDE */}
        <Box
          sx={{
            p: { xs: 3, sm: 4, md: 5.5 },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: 0,
          }}
        >
          {/* Mobile logo */}
          <Box
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              gap: 1.25,
              mb: 4,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: "#4f46e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LayersIcon size={21} color="#fff" strokeWidth={2} />
            </Box>

            <Typography
              sx={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "#0f172a",
              }}
            >
              Vicky Stack
            </Typography>
          </Box>

          {/* Heading */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: { xs: "1.8rem", md: "2rem" },
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.035em",
                mb: 0.8,
              }}
            >
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </Typography>

            <Typography
              sx={{
                color: "#64748b",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {mode === "signin"
                ? "Sign in to continue to your workspace."
                : "Get started with your workspace in seconds."}
            </Typography>
          </Box>

          {/* Tabs */}
          <Box
            sx={{
              p: 0.5,
              borderRadius: 2.5,
              bgcolor: "#f1f5f9",
              mb: 3.5,
            }}
          >
            <Tabs
              value={mode}
              onChange={(_, value) => switchMode(value)}
              variant="fullWidth"
              sx={{
                minHeight: 42,

                "& .MuiTabs-indicator": {
                  display: "none",
                },

                "& .MuiTab-root": {
                  minHeight: 42,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.84rem",
                  color: "#64748b",
                },

                "& .Mui-selected": {
                  color: "#312e81 !important",
                  bgcolor: "#fff",
                  boxShadow: "0 2px 8px rgba(15,23,42,0.08)",
                },
              }}
            >
              <Tab label="Sign in" value="signin" />
              <Tab label="Create account" value="signup" />
            </Tabs>
          </Box>

          {/* Animated form */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Slide
              direction={mode === "signin" ? "right" : "left"}
              in
              key={mode}
              timeout={350}
            >
              <Box>
                <Fade in timeout={400}>
                  <Box>
                    <form onSubmit={handleSubmit}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2.2,
                        }}
                      >
                        {/* Full Name */}
                        {mode === "signup" && (
                          <Field label="Full name" required>
                            <TextField
                              placeholder="Vignesh Raaj"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              fullWidth
                              size="small"
                              sx={inputStyles}
                            />
                          </Field>
                        )}

                        {/* Email */}
                        <Field label="Email address" required>
                          <TextField
                            placeholder="you@example.com"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            fullWidth
                            size="small"
                            sx={inputStyles}
                          />
                        </Field>

                        {/* Password */}
                        <Field label="Password" required>
                          <TextField
                            placeholder="Enter your password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            fullWidth
                            size="small"
                            sx={inputStyles}
                            InputProps={{
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton
                                    onClick={() =>
                                      setShowPassword((prev) => !prev)
                                    }
                                    edge="end"
                                    size="small"
                                    sx={{
                                      color: "#94a3b8",
                                      "&:hover": {
                                        color: "#4f46e5",
                                        background: "rgba(79,70,229,0.06)",
                                      },
                                    }}
                                  >
                                    {showPassword ? (
                                      <VisibilityOff fontSize="small" />
                                    ) : (
                                      <Visibility fontSize="small" />
                                    )}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Field>

                        {/* Error */}
                        {error && (
                          <Alert
                            severity="error"
                            sx={{
                              borderRadius: 2,
                              fontSize: "0.82rem",
                            }}
                          >
                            {error}
                          </Alert>
                        )}

                        {/* Success */}
                        {info && (
                          <Alert
                            severity="success"
                            sx={{
                              borderRadius: 2,
                              fontSize: "0.82rem",
                            }}
                          >
                            {info}
                          </Alert>
                        )}

                        {/* Button */}
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                          endIcon={!loading && <ArrowForward />}
                          sx={{
                            mt: 0.5,
                            height: 50,
                            borderRadius: "12px",
                            textTransform: "none",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            bgcolor: "#4f46e5",
                            boxShadow: "0 8px 20px rgba(79,70,229,0.25)",
                            "&:hover": {
                              bgcolor: "#4338ca",
                              boxShadow: "0 10px 25px rgba(79,70,229,0.3)",
                            },
                            "&:disabled": {
                              bgcolor: "#a5b4fc",
                              color: "#fff",
                            },
                          }}
                        >
                          {loading
                            ? "Please wait..."
                            : mode === "signin"
                              ? "Sign in"
                              : "Create account"}
                        </Button>
                      </Box>
                    </form>
                  </Box>
                </Fade>
              </Box>
            </Slide>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

/* ---------------------------------------
   Reusable field wrapper
---------------------------------------- */

function Field({
  label,
  required,
  helperText,
  rightLabel,
  children,
}: {
  label: string;
  required?: boolean;
  helperText?: string;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.8,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.8rem",
            fontWeight: 650,
            color: "#334155",
          }}
        >
          {label}
          {required && (
            <Box
              component="span"
              sx={{
                color: "#ef4444",
                ml: 0.3,
              }}
            >
              *
            </Box>
          )}
        </Typography>

        {rightLabel && (
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#4f46e5",
              cursor: "pointer",
              "&:hover": {
                textDecoration: "underline",
              },
            }}
          >
            {rightLabel}
          </Typography>
        )}
      </Box>

      {children}

      {helperText && (
        <Typography
          sx={{
            mt: 0.6,
            ml: 0.2,
            fontSize: "0.7rem",
            color: "#94a3b8",
          }}
        >
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

/* ---------------------------------------
   Input styling
---------------------------------------- */

const inputStyles = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "12px",
    backgroundColor: "#f8fafc",
    transition: "all 0.2s ease",

    "& fieldset": {
      border: "1px solid #e2e8f0",
      transition: "all 0.2s ease",
    },

    "&:hover": {
      backgroundColor: "#fff",

      "& fieldset": {
        borderColor: "#cbd5e1",
      },
    },

    "&.Mui-focused": {
      backgroundColor: "#fff",
      boxShadow: "0 0 0 4px rgba(79,70,229,0.08)",

      "& fieldset": {
        borderColor: "#6366f1",
        borderWidth: "1px",
      },
    },

    "& input": {
      fontSize: "0.88rem",
      color: "#0f172a",
      padding: "0 16px",

      "&::placeholder": {
        color: "#94a3b8",
        opacity: 1,
      },
    },
  },
};
