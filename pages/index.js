import Link from "next/link";
import { setOnboardingIntent } from "../lib/localOnboarding";

const employerCtaHref = "/employer/register?onboarding=1";

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="overlay" aria-hidden="true" />

        <h1 className="title">Traveling Overtime Jobs</h1>
        <p className="subtitle">
          Discover vetted opportunities that include travel pay and overtime, or share
          openings with crews ready to hit the road.
        </p>

        <div className="hero-stack">
          <Link className="hero-link" href="/jobs">
            Search Jobs
          </Link>
          <Link
            className="hero-link"
            href={employerCtaHref}
            onClick={() => setOnboardingIntent("employer")}
          >
            Post Jobs
          </Link>
          <Link
            className="hero-link"
            href="/login"
            onClick={() => setOnboardingIntent("employer")}
          >
            Employer Login
          </Link>
          <Link
            className="hero-link"
            href="/login"
            onClick={() => setOnboardingIntent("jobseeker")}
          >
            Jobseeker Login
          </Link>
        </div>
      </section>

      <section className="home-main">
        <div className="max960 home-intro">
          <h2 className="home-heading">Find your traveling overtime job</h2>
          <p>
            Jump straight into the tools designed for jobseekers and employers in traveling
            skilled trades.
          </p>

          <div className="home-quick-actions">
            <Link className="btn" href="/jobs">
              Search Jobs
            </Link>
            <Link
              className="btn-outline"
              href={employerCtaHref}
              onClick={() => setOnboardingIntent("employer")}
            >
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

          <div className="home-aside-grid">
            <div>
              <strong>Employer or jobseeker account?</strong>
              <p>
                Set your intent when you log in so we can guide you to either manage
                applicants or apply to openings in seconds.
              </p>
            </div>
            <div>
              <strong>Need an account?</strong>
              <p>
                Create one in minutes on the sign-up page. Employers can assign team logins
                and jobseekers can track applications.
              </p>
              <Link className="btn" href="/signup">
                Create account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
