import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import Link from "next/link";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignUp = async () => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Sign up successful! Check your email.");
    }
  };

  // --- Matching Full Screen Styles ---
  const containerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)",
    fontFamily: "'Inter', -apple-system, sans-serif",
    margin: 0,
    padding: 0,
  };

  const cardStyle = {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "48px 40px",
    borderRadius: "16px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    width: "100%",
    maxWidth: "400px",
    textAlign: "center",
  };

  const headerStyle = {
    fontSize: "28px",
    fontWeight: "800",
    color: "#111827",
    margin: "0 0 8px 0",
  };

  const subHeaderStyle = {
    fontSize: "14px",
    color: "#6b7280",
    marginBottom: "32px",
  };

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    marginBottom: "16px",
    borderRadius: "10px",
    border: "1px solid #e5e7eb",
    fontSize: "15px",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };

  const buttonStyle = {
    width: "100%",
    padding: "14px",
    backgroundColor: "#0d9488", // Teal color for "Create Account" to slightly differentiate from login
    color: "white",
    border: "none",
    borderRadius: "10px",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "8px",
    transition: "transform 0.1s, background-color 0.2s",
  };

  const footerStyle = {
    marginTop: "24px",
    fontSize: "14px",
    color: "#4b5563",
  };

  const linkStyle = {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={headerStyle}>Create Account</h2>
        <p style={subHeaderStyle}>Join us today! It only takes a minute.</p>

        <input
          type="email"
          placeholder="Email Address"
          style={inputStyle}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          style={inputStyle}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm Password"
          style={inputStyle}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button 
          onClick={handleSignUp} 
          style={buttonStyle}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#0b7a6f")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#0d9488")}
          onMouseDown={(e) => (e.target.style.transform = "scale(0.98)")}
          onMouseUp={(e) => (e.target.style.transform = "scale(1)")}
        >
          Get Started
        </button>

        <p style={footerStyle}>
          Already have an account?{" "}
          <Link href="/login" style={linkStyle}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}