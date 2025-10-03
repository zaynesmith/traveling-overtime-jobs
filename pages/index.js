import Link from "next/link";
import { setOnboardingIntent } from "../lib/localOnboarding";

const employerCtaHref = "/employer/register?onboarding=1";

export default function HomePage() {
  return (
    <main className="home">
      <section className="hero">
        <h1>Traveling Overtime Jobs</h1>
        <p>Match traveling crews with high-paying overtime work fast.</p>
        <div className="hero-actions">
          <Link className="btn" href="/jobs">
            Browse jobs
          </Link>
          <Link
            className="btn-outline"
            href={employerCtaHref}
            onClick={() => setOnboardingIntent("employer")}
          >
            Hire talent
          </Link>
          <Link className="btn" href="/signup">
            Sign up
          </Link>
          <Link className="btn" href="/login">
            Log in
          </Link>
        </div>
      </section>

      <section className="home-panels">
        <article>
          <h2>Jobseekers</h2>
          <p>Explore assignments that include travel pay and overtime without logging in.</p>
          <Link className="btn" href="/jobs">
            View open roles
          </Link>
        </article>
        <article>
          <h2>Employers</h2>
          <p>Draft your hiring needs, then finish onboarding to reach qualified travelers.</p>
          <Link
            className="btn-outline"
            href={employerCtaHref}
            onClick={() => setOnboardingIntent("employer")}
          >
            Start employer onboarding
          </Link>
        </article>
      </section>
    </main>
  );
}
