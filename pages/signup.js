"use client";

import { useState, useId } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    inset: 0,
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
  // Password strength bar
  strengthWrap: {
    marginTop: "6px",
    display: "flex",
    gap: "4px",
  },
  strengthSegment: (active, color) => ({
    flex: 1,
    height: "3px",
    borderRadius: "999px",
    background: active ? color : "#1e2d45",
    transition: "background 0.3s ease",
  }),
  strengthLabel: {
    fontSize: "11px",
    marginTop: "4px",
    textAlign: "right",
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = [
    { label: "", color: "" },
    { label: "Weak", color: "#ef4444" },
    { label: "Fair", color: "#f97316" },
    { label: "Good", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
  ];
  return { score, ...map[score] };
};

// ── SVG Icons ─────────────────────────────────────────────────────────────────

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

// ── Component ────────────────────────────────────────────────────────────────

export default function SignUp() {
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

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

  const handleSignUp = async () => {
    clearMessage();

    if (!email || !password || !confirmPassword) {
      showMessage("Please fill in all fields.");
      return;
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      showMessage(error.message);
      return;
    }

    showMessage(
      "Account created! Please check your email and verify your account before logging in.",
      "success"
    );

    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignUp();
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
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        </div>

        <h1 style={styles.header}>Create Account</h1>
        <p style={styles.subHeader}>Sign up and verify your email to get started</p>

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
          <label htmlFor={passwordId} style={styles.label}>Password</label>
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
              autoComplete="new-password"
              style={styles.input}
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearMessage(); }}
              onKeyDown={handleKeyDown}
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <>
              <div style={styles.strengthWrap} aria-hidden="true">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={styles.strengthSegment(strength.score >= i, strength.color)} />
                ))}
              </div>
              <p style={{ ...styles.strengthLabel, color: strength.color }}>
                {strength.label}
              </p>
            </>
          )}
        </div>

        {/* Confirm Password */}
        <div style={styles.fieldGroup}>
          <label htmlFor={confirmPasswordId} style={styles.label}>Confirm Password</label>
          <div style={styles.inputWrap}>
            <span style={styles.inputIcon} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </span>
            <input
              id={confirmPasswordId}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearMessage(); }}
              onKeyDown={handleKeyDown}
              aria-required="true"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              style={styles.eyeButton}
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSignUp}
          style={buttonStyle}
          disabled={loading}
          aria-busy={loading}
        >
          {loading ? "Creating Account…" : "Get Started"}
        </button>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link href="/login" style={styles.footerLink}>Sign In</Link>
        </p>
      </div>
    </main>
  );
}