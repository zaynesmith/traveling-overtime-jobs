import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function Card({ href, title, description, children }) {
  return (
    <Link
      href={href}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-sky-600">
          Open
          <svg
            aria-hidden="true"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function formatLastActive(value) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  const diffMs = Date.now() - date.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return "Active today";
  return `Active ${days} day${days === 1 ? "" : "s"} ago`;
}

export default function JobseekerDashboard({ profileSummary, applicationCount, recentActivity, bumpEligible }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <header className="space-y-3 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Jobseeker Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Your next assignment starts here</h1>
          <p className="max-w-3xl text-base text-slate-600">
            Keep your profile sharp, explore new postings, and track applications—all from this streamlined control center.
          </p>
        </header>

        <section>
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <Card href="/dashboard/jobseeker/profile" title="Profile" description="Update your info and upload your resume.">
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{profileSummary.completed}/{profileSummary.total} fields complete</p>
                <p className="mt-2 text-xs text-slate-500">Complete your profile to stand out to employers.</p>
              </div>
            </Card>

            <Card href="/dashboard/jobseeker/jobs" title="Job Search" description="Browse and filter the latest travel jobs.">
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Search by trade, location, and keywords</li>
                <li>• See overtime and per diem details at a glance</li>
                <li>• Apply directly from the listings</li>
              </ul>
            </Card>

            <Card href="/dashboard/jobseeker/applications" title="Applications" description="Track your recent submissions.">
              <p className="text-sm text-slate-600">
                You&apos;ve submitted <span className="font-semibold text-slate-900">{applicationCount}</span> application
                {applicationCount === 1 ? "" : "s"}.
              </p>
            </Card>

            <Card href="/dashboard/jobseeker/activity" title="Activity" description="Control visibility and boost your profile.">
              <p className="text-sm text-slate-600">
                {formatLastActive(recentActivity)} · {bumpEligible ? "Eligible for profile bump" : "Bump available soon"}
              </p>
            </Card>

            <Card href="/dashboard/jobseeker/settings" title="Settings" description="Manage alerts, privacy, and account access.">
              <p className="text-sm text-slate-600">
                Configure job alerts, update your password, and control who can view your profile.
              </p>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/jobseeker/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "jobseeker") {
    const destination = session.user?.role === "employer" ? "/dashboard/employer" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const applications = await prisma.applications.findMany({
      where: { jobseeker_id: profile?.id || "" },
      select: { id: true },
    });

    const totalFields = 9; // matches profile fields tracked in the editor
    const completed = [
      profile?.firstName,
      profile?.lastName,
      profile?.email,
      profile?.trade,
      profile?.address1,
      profile?.city,
      profile?.state,
      profile?.zip,
      profile?.resumeUrl,
    ].filter((value) => Boolean(value && String(value).trim())).length;

    const lastActive = profile?.lastActive ? profile.lastActive.toISOString?.() ?? profile.lastActive : null;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const bumpEligible = !lastActive || Date.now() - new Date(lastActive).getTime() >= sevenDaysMs;

    return {
      props: {
        profileSummary: { total: totalFields, completed },
        applicationCount: applications.length,
        recentActivity: lastActive,
        bumpEligible,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        profileSummary: { total: 9, completed: 0 },
        applicationCount: 0,
        recentActivity: null,
        bumpEligible: true,
      },
    };
  }
}
