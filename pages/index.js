import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="overlay" aria-hidden="true" />

        <h1 className="title">Traveling Overtime Jobs</h1>
        <p className="subtitle">
          Discover vetted opportunities that include travel pay and overtime, or share openings with crews ready to hit the road.
        </p>

        <div className="hero-stack">
          <Link className="hero-link" href="/jobs">
            Search Jobs
          </Link>
          <Link className="hero-link" href="/employer/register">
            Post Jobs
          </Link>
          <Link className="hero-link" href="/employer/login">
            Employer Login
          </Link>
          <Link className="hero-link" href="/jobseeker/login">
            Jobseeker Login
          </Link>
        </div>
      </section>

      <section className="home-main">
        <div className="max960 home-intro">
          <h2 className="home-heading">Find your traveling overtime job</h2>
          <p>
            Jump straight into the tools designed for jobseekers and employers in traveling skilled trades.
          </p>

          <div className="home-quick-actions">
            <Link className="btn" href="/jobs">
              Search Jobs
            </Link>
            <Link className="btn-outline" href="/employer/register">
              Post Jobs
            </Link>
          </div>

          <div className="home-panel">
            <h3>Get matched with assignments fast</h3>
            <ul>
              <li>Filter by trade, company, travel pay, and overtime.</li>
              <li>Track new postings as soon as teams share them.</li>
              <li>Save jobs to review later once you sign up.</li>
            </ul>
          </div>

          <div className="home-bottom-links">
            <Link className="home-bottom-link" href="/employer/register">
              Create an Employer Account
            </Link>
            <Link className="home-bottom-link" href="/jobseeker/register">
              Create a Jobseeker Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
