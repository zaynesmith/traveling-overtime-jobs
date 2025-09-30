import Link from "next/link";

const HERO_LINKS = [
  { href: "/jobseeker/search", label: "Search Jobs" },
  { href: "/post-job", label: "Post Jobs" },
  { href: "/sign-in?role=employer", label: "Employer Login" },
  { href: "/sign-in?role=jobseeker", label: "Jobseeker Login" },
];

export default function HomePage() {
  return (
    <>
      <section className="hero" role="region" aria-label="Traveling Overtime Jobs hero">
        <span className="overlay" aria-hidden="true" />
        <h1 className="title">Traveling Overtime Jobs</h1>
        <p className="subtitle">
          Discover vetted opportunities that include travel pay and overtime, or share openings with teams ready to hit the
          road.
        </p>

        <div className="hero-stack" role="navigation" aria-label="Primary actions">
          {HERO_LINKS.map((link) => (
            <Link key={link.href} className="hero-link" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>
      </section>

      <main className="home-main">
        <div className="max960" style={{ display: "grid", gap: 32 }}>
          <div className="home-intro">
            <h2 style={{ margin: 0 }}>Jump straight into the tools built for the road</h2>
            <p style={{ margin: 0, color: "#4b5563" }}>
              Whether you&apos;re scouting your next assignment or hiring traveling talent, the shortcuts below get you to the
              right place fast.
            </p>
            <div className="home-quick-actions">
              <Link className="btn" href="/jobseeker/search">
                Search Jobs
              </Link>
              <Link className="btn-outline" href="/post-job">
                Post Jobs
              </Link>
            </div>
          </div>

          <section className="home-panel">
            <header style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0 }}>Find your next traveling overtime job</h3>
              <p style={{ margin: 0, color: "#4b5563" }}>
                Browse industrial and skilled trade openings that clearly outline travel pay, per diem, and overtime.
              </p>
            </header>
            <ul>
              <li>Filter by trade, company, or location to match assignments to your skills.</li>
              <li>See what crews are paying before you call so you can line up your next check.</li>
              <li>Save postings and track demo applications as soon as you sign in as a jobseeker.</li>
            </ul>
            <Link className="btn" href="/jobseeker/search">
              Browse job postings
            </Link>
          </section>

          <section className="home-panel">
            <header style={{ display: "grid", gap: 6 }}>
              <h3 style={{ margin: 0 }}>Share openings with qualified travelers</h3>
              <p style={{ margin: 0, color: "#4b5563" }}>
                Draft your listing details, then finish publishing once you sign in or create an employer account.
              </p>
            </header>
            <ul>
              <li>Highlight shift schedules, travel expectations, and per diem up front.</li>
              <li>Keep drafts handy—your work saves so you can finish after creating an account.</li>
              <li>Log in as an employer to manage postings and follow up with travelers quickly.</li>
            </ul>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link className="btn" href="/post-job">
                Create a job listing
              </Link>
              <Link className="btn-outline" href="/sign-in?role=employer">
                Employer login
              </Link>
            </div>
          </section>

          <div className="home-aside-grid">
            <div>
              <strong>Employer or jobseeker accounts</strong>
              <p>
                Sign in with the appropriate role to unlock saved jobs, demo applications, and employer tools tailored to
                your crew.
              </p>
            </div>
            <div>
              <strong>Need an account?</strong>
              <p>
                Create one in minutes on the sign-up page. Employers can manage listings and jobseekers can track
                applications.
              </p>
              <Link className="pill-light" href="/sign-up">
                Sign up now
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}