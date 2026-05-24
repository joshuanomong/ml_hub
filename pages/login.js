"use client";

import { useState, useId } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: {
      display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",   // ← change from "center"
  position: "fixed",
  inset: 0,
  overflowY: "auto",           // ← add this
  padding: "24px 16px",        // ← add this so card doesn't touch edges
  background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0b1220 100%)",
  fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: "rgba(17, 24, 39, 0.98)",
    padding: "40px 36px",
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    border: "1px solid #1e2d45",
  },
  iconWrap: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "rgba(56, 201, 240, 0.12)",
    border: "1px solid rgba(56, 201, 240, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    color: "#38c9f0",
  },
  header: {
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    margin: "0 0 6px",
  },
  subHeader: {
    fontSize: "13px",
    color: "#64748b",
    margin: "0 0 20px",
  },
  liveRegion: {
    fontSize: "13px",
    minHeight: "20px",
    marginBottom: "8px",
  },
  fieldGroup: {
    marginBottom: "12px",
    textAlign: "left",
  },
  label: {
    display: "block",
    fontSize: "12px",
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: "6px",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
  },
  passwordLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "6px",
  },
  inputWrap: {
    position: "relative",
  },
  inputIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    color: "#475569",
    pointerEvents: "none",
    display: "flex",
  },
  input: {
    width: "100%",
    padding: "11px 40px 11px 40px",
    borderRadius: "10px",
    border: "1px solid #1e2d45",
    background: "#0d1829",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  // Eye toggle button inside password field
  eyeButton: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
  forgot: {
    fontSize: "12px",
    color: "#38c9f0",
    textDecoration: "none",
    cursor: "pointer",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "999px",
    border: "none",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: "pointer",
    letterSpacing: "0.3px",
    marginTop: "4px",
    fontFamily: "inherit",
  },
  // Divider between main login and social buttons
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    margin: "20px 0",
  },
  dividerLine: {
    flex: 1,
    height: "1px",
    background: "#1e2d45",
  },
  dividerText: {
    fontSize: "12px",
    color: "#475569",
    whiteSpace: "nowrap",
  },
  // Social login buttons
  socialButton: {
    width: "100%",
    padding: "11px 16px",
    borderRadius: "10px",
    border: "1px solid #1e2d45",
    background: "#0d1829",
    color: "#cbd5e1",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  footer: {
    marginTop: "20px",
    fontSize: "13px",
    color: "#475569",
  },
  footerLink: {
    color: "#38c9f0",
    fontWeight: "600",
    textDecoration: "none",
  },
};

// ── SVG Icons ────────────────────────────────────────────────────────────────

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

// ── Component ────────────────────────────────────────────────────────────────

export default function Login() {
  const router = useRouter();
  const emailId = useId();
  const passwordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(""); // "google" | "github" | ""

  const showMessage = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const clearMessage = () => {
    if (message) {
      setMessage("");
      setMessageType("");
    }
  };

  const handleLogin = async () => {
    clearMessage();

    if (!email || !password) {
      showMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      showMessage(error.message);
      return;
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      showMessage("Please verify your email before logging in.");
      return;
    }

    showMessage("Login successful! Redirecting...", "success");

    setTimeout(() => {
      router.push("/dashboard");
    }, 800);
  };

  const handleSocialLogin = async (provider) => {
    clearMessage();
    setSocialLoading(provider);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      showMessage(error.message);
      setSocialLoading("");
    }
    // On success Supabase redirects the browser — no further action needed
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const buttonStyle = {
    ...styles.button,
    background: loading ? "rgba(56,201,240,0.3)" : "#38c9f0",
    color: loading ? "rgba(255,255,255,0.4)" : "#0a2a50",
    cursor: loading ? "not-allowed" : "pointer",
  };

  const messageColor = messageType === "success" ? "#34d399" : "#fbbf24";

  return (
    <main style={styles.container}>
      <div style={styles.card}>

        {/* Icon */}
        <div style={styles.iconWrap} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h1 style={styles.header}>Welcome Back</h1>
        <p style={styles.subHeader}>Sign in to your account</p>

        {/* Live region */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{ ...styles.liveRegion, color: messageColor, visibility: message ? "visible" : "hidden" }}
        >
          {message || " "}
        </div>

        {/* Email */}
        <div style={styles.fieldGroup}>
          <label htmlFor={emailId} style={styles.label}>Email address</label>
          <div style={styles.inputWrap}>
            <span style={styles.inputIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </span>
            <input
              id={emailId}
              type="email"
              placeholder="you@example.com"
              autoComplete="email"
              style={styles.input}
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearMessage(); }}
              onKeyDown={handleKeyDown}
              aria-required="true"
            />
          </div>
        </div>

        {/* Password */}
        <div style={styles.fieldGroup}>
          <div style={styles.passwordLabelRow}>
            <label htmlFor={passwordId} style={{ ...styles.label, marginBottom: 0 }}>Password</label>
            <Link href="/forgot-password" style={styles.forgot}>Forgot password?</Link>
          </div>
          <div style={styles.inputWrap}>
            <span style={styles.inputIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id={passwordId}
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              style={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearMessage(); }}
              onKeyDown={handleKeyDown}
              aria-required="true"
            />
            {/* Show / hide toggle */}
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Sign in button */}
        <button
          onClick={handleLogin}
          style={buttonStyle}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or continue with</span>
          <div style={styles.dividerLine} />
        </div>

        {/* Google */}
        <button
          onClick={() => handleSocialLogin("google")}
          style={styles.socialButton}
          disabled={!!socialLoading}
          aria-busy={socialLoading === "google"}
        >
          <GoogleIcon />
          {socialLoading === "google" ? "Redirecting…" : "Continue with Google"}
        </button>

        {/* GitHub */}
        <button
          onClick={() => handleSocialLogin("github")}
          style={styles.socialButton}
          disabled={!!socialLoading}
          aria-busy={socialLoading === "github"}
        >
          <GitHubIcon />
          {socialLoading === "github" ? "Redirecting…" : "Continue with GitHub"}
        </button>

        <p style={styles.footer}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={styles.footerLink}>Sign Up</Link>
        </p>
      </div>
    </main>
  );
}