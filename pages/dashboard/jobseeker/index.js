import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function DashboardCard({ href, title, description, children, cta = "Open" }) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors duration-300 group-hover:bg-slate-700">
          {cta}
          <svg
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
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

export default function JobseekerDashboard({
  profileSummary,
  applicationCount,
  recentActivity,
  bumpEligible,
  greetingName,
}) {
  const heading = greetingName ? `Welcome back, ${greetingName}` : "Welcome back";

  return (
    <main className="bg-slate-100">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Jobseeker Dashboard</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{heading}</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Jump straight into the tools designed to keep your profile sharp, uncover fresh postings, and stay ahead of new opportunities in traveling skilled trades.
          </p>
        </div>
      </div>

      <section className="relative z-10 -mt-12 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            <DashboardCard
              href="/dashboard/jobseeker/profile"
              title="Profile"
              description="Keep your travel-ready profile polished with the essentials employers want to see."
              cta="Review"
            >
              <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">
                <p className="font-semibold text-slate-900">{profileSummary.completed}/{profileSummary.total} fields complete</p>
                <p className="mt-2 text-xs text-slate-500">Complete your profile to stand out to employers.</p>
              </div>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/jobs"
              title="Job Search"
              description="Browse curated overtime roles with the filters and signals you rely on."
              cta="Explore"
            >
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Filter by trade, location, and keywords</li>
                <li>• Preview overtime and per diem quickly</li>
                <li>• Save roles for later follow-up</li>
              </ul>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/applications"
              title="Applications"
              description="See where you stand at a glance with every assignment you&apos;ve pursued."
              cta="Track"
            >
              <p className="text-sm text-slate-600">
                You&apos;ve applied to <span className="font-semibold text-slate-900">{applicationCount}</span> job
                {applicationCount === 1 ? "" : "s"}.
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/activity"
              title="Activity"
              description="Control when employers can find you and trigger boosts when you&apos;re ready."
              cta="Manage"
            >
              <p className="text-sm text-slate-600">
                {formatLastActive(recentActivity)} · {bumpEligible ? "Eligible for profile bump" : "Bump available soon"}
              </p>
            </DashboardCard>

            <DashboardCard
              href="/dashboard/jobseeker/settings"
              title="Settings"
              description="Fine-tune alerts, privacy controls, and account access in one spot."
              cta="Adjust"
            >
              <p className="text-sm text-slate-600">
                Configure job alerts, update security preferences, and control visibility.
              </p>
            </DashboardCard>
          </div>
        </div>
      </section>
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

  const baseGreeting = session.user?.name?.split?.(" ")[0] || "";

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    const applications = await prisma.applications.findMany({
      where: { jobseeker_id: profile?.id || "" },
      select: { id: true },
    });

    const totalFields = 9;
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
        greetingName: profile?.firstName?.trim() || baseGreeting,
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
        greetingName: baseGreeting,
      },
    };
  }
}
