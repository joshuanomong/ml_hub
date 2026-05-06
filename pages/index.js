import Link from "next/link";

export default function Home() {
  const btnBase = {
    padding: "0.65rem 2.5rem",
    borderRadius: "999px",
    fontWeight: "600",
    fontSize: "0.95rem",
    cursor: "pointer",
    letterSpacing: "0.3px",
    transition: "opacity 0.15s, transform 0.15s",
    textDecoration: "none",
    display: "inline-block",
  };

  const loginBtnStyle = {
    ...btnBase,
    background: "rgba(255,255,255,0.18)",
    color: "white",
    border: "1.5px solid rgba(255,255,255,0.45)",
    marginRight: "12px",
  };

  const signupBtnStyle = {
    ...btnBase,
    background: "#38c9f0",
    color: "#0a2a50",
    border: "none",
  };

  return (
    <div className="hero">
      <h1>Machine Learning Hub</h1>
      <p>A simple integrated web app using Supabase and Vercel.</p>

      <div style={{ marginTop: "30px", display: "flex", justifyContent: "center", gap: "12px" }}>
        <Link href="/login">
          <button style={loginBtnStyle}>Login</button>
        </Link>

        <Link href="/signup">
          <button style={signupBtnStyle}>Sign Up</button>
        </Link>
      </div>
    </div>
  );
}