// pages/index.js
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container" style={{ textAlign: "center", padding: "50px" }}>
      <h1>Welcome to Traveling Overtime Jobs</h1>
      <p>Please choose how you’d like to log in:</p>

      <div style={{ marginTop: "30px" }}>
        <Link href="/sign-in?role=employer">
          <button style={{ margin: "10px", padding: "10px 20px" }}>
            Employer Login
          </button>
        </Link>

        <Link href="/sign-in?role=jobseeker">
          <button style={{ margin: "10px", padding: "10px 20px" }}>
            Jobseeker Login
          </button>
        </Link>
      </div>
    </main>
  );
}