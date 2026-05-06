import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setMessage("");

    if (!email || !password) {
      setMessage("Please fill in all fields.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (!data.user?.email_confirmed_at) {
      await supabase.auth.signOut();
      setMessage("Please verify your email before logging in.");
      return;
    }

    setMessage("Login successful! Redirecting...");

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 800);
  };

  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0b1220 100%)",
    fontFamily: "'Inter', sans-serif",
  };

  const cardStyle = {
    backgroundColor: "rgba(17, 24, 39, 0.98)",
    padding: "40px 36px",
    borderRadius: "20px",
    boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
    border: "1px solid #1e2d45",
  };

  const iconWrapStyle = {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "rgba(56, 201, 240, 0.12)",
    border: "1px solid rgba(56, 201, 240, 0.25)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    fontSize: "22px",
    color: "#38c9f0",
  };

  const headerStyle = {
    fontSize: "22px",
    fontWeight: "700",
    color: "#fff",
    marginBottom: "6px",
  };

  const subHeaderStyle = {
    fontSize: "13px",
    color: "#64748b",
    marginBottom: "28px",
  };

  const inputWrapStyle = {
    position: "relative",
    marginBottom: "12px",
    textAlign: "left",
  };

  const inputIconStyle = {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    color: "#475569",
    pointerEvents: "none",
  };

  const inputStyle = {
    width: "100%",
    padding: "11px 14px 11px 40px",
    borderRadius: "10px",
    border: "1px solid #1e2d45",
    background: "#0d1829",
    color: "white",
    outline: "none",
    fontSize: "14px",
    boxSizing: "border-box",
  };

  const forgotStyle = {
    display: "block",
    fontSize: "12px",
    color: "#38c9f0",
    textAlign: "right",
    marginBottom: "16px",
    marginTop: "-4px",
    cursor: "pointer",
    textDecoration: "none",
  };

  const buttonStyle = {
    width: "100%",
    padding: "12px",
    borderRadius: "999px",
    background: loading ? "rgba(56,201,240,0.3)" : "#38c9f0",
    color: loading ? "rgba(255,255,255,0.4)" : "#0a2a50",
    border: "none",
    fontWeight: "700",
    fontSize: "0.9rem",
    cursor: loading ? "not-allowed" : "pointer",
    letterSpacing: "0.3px",
    transition: "opacity 0.15s",
  };

  const messageStyle = {
    marginTop: "12px",
    fontSize: "13px",
    color: message.includes("successful") ? "#34d399" : "#fbbf24",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>

        {/* Icon */}
        <div style={iconWrapStyle}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h2 style={headerStyle}>Welcome Back</h2>
        <p style={subHeaderStyle}>Sign in to your account</p>

        {/* Email input */}
        <div style={inputWrapStyle}>
          <span style={inputIconStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </span>
          <input
            type="email"
            placeholder="Email address"
            style={inputStyle}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Password input */}
        <div style={inputWrapStyle}>
          <span style={inputIconStyle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            type="password"
            placeholder="Password"
            style={inputStyle}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Forgot password */}
        <Link href="/forgot-password" style={forgotStyle}>
          Forgot password?
        </Link>

        <button
          onClick={handleLogin}
          style={buttonStyle}
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>

        {message && <p style={messageStyle}>{message}</p>}

        <p style={{ marginTop: "20px", fontSize: "13px", color: "#475569" }}>
          Don't have an account?{" "}
          <Link href="/signup" style={{ color: "#38c9f0", fontWeight: "600" }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}