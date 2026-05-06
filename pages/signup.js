import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    setMessage("");

    if (!email || !password || !confirmPassword) {
      setMessage("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Account created! Please check your email and verify your account before logging in."
    );

    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      position: "fixed",
      top: 0, left: 0,
      width: "100vw",
      height: "100vh",
      background: "linear-gradient(135deg, #0f172a 0%, #111827 50%, #0b1220 100%)",
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        backgroundColor: "rgba(17, 24, 39, 0.95)",
        padding: "40px 36px",
        borderRadius: "16px",
        boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
        width: "100%",
        maxWidth: "400px",
        textAlign: "center",
        border: "1px solid #1f2937",
      }}>

        {/* Icon */}
        <div style={{
          width: "64px", height: "64px",
          background: "#1a2e3d",
          borderRadius: "14px",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
        </div>

        <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#fff", marginBottom: "8px" }}>
          Create Account
        </h2>
        <p style={{ fontSize: "14px", color: "#94a3b8", marginBottom: "28px" }}>
          Sign up and verify your email
        </p>

        {/* Email */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: "10px",
          padding: "0 14px",
          gap: "10px",
          marginBottom: "12px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <polyline points="22,4 12,13 2,4"/>
          </svg>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "white", fontFamily: "'Inter', sans-serif",
              fontSize: "14px", padding: "13px 0",
            }}
          />
        </div>

        {/* Password */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: "10px",
          padding: "0 14px",
          gap: "10px",
          marginBottom: "12px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "white", fontFamily: "'Inter', sans-serif",
              fontSize: "14px", padding: "13px 0",
            }}
          />
        </div>

        {/* Confirm Password */}
        <div style={{
          display: "flex", alignItems: "center",
          background: "#0b1220",
          border: "1px solid #1f2937",
          borderRadius: "10px",
          padding: "0 14px",
          gap: "10px",
          marginBottom: "8px",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="#4a5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <path d="M12 16v2"/>
          </svg>
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: "white", fontFamily: "'Inter', sans-serif",
              fontSize: "14px", padding: "13px 0",
            }}
          />
        </div>

        {/* Button */}
        <button
          onClick={handleSignUp}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            backgroundColor: loading ? "#64748b" : "#22d3ee",
            color: loading ? "#fff" : "#0d1117",
            border: "none",
            borderRadius: "50px",
            fontWeight: "700",
            fontSize: "15px",
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: "8px",
            letterSpacing: "0.3px",
          }}
        >
          {loading ? "Creating Account..." : "Get Started"}
        </button>

        {/* Message */}
        {message && (
          <p style={{ marginTop: "12px", fontSize: "13px", color: "#fbbf24", lineHeight: "1.5" }}>
            {message}
          </p>
        )}

        {/* Login link */}
        <p style={{ marginTop: "20px", fontSize: "13px", color: "#94a3b8" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#22d3ee", fontWeight: "500" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}