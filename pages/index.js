import Link from "next/link";

export default function Home() {
  return (
    <div className="hero">
      <h1>Machine Learning Hub</h1>
      <p>A simple integrated web app using Supabase and Vercel.</p>

      <div style={{ marginTop: "30px" }}>
        <Link href="/login">
          <button className="button">Login</button>
        </Link>

        <Link href="/signup">
          <button className="button">Sign Up</button>
        </Link>
      </div>
    </div>
  );
}