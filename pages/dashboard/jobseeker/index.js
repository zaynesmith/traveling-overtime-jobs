import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

const cards = [
  {
    href: "/dashboard/jobseeker/profile",
    title: "Profile",
    description: "Complete your profile and catch the eyes of employers.",
    cta: "Update",
  },
  {
    href: "/dashboard/jobseeker/jobs",
    title: "Job Search",
    description: "Explore new assignments tailored to your skills and travel goals.",
    cta: "Search",
  },
  {
    href: "/dashboard/jobseeker/applications",
    title: "Applications",
    description: "Check on your submissions and see any updates.",
    cta: "View",
  },
  {
    href: "/dashboard/jobseeker/activity",
    title: "Activity",
    description: "See your recent searches, saved jobs, and more.",
    cta: "View",
  },
];

function DashboardCard({ href, title, description, cta }) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col justify-between rounded-3xl bg-white/95 p-8 text-left shadow-[0_20px_48px_rgba(15,23,42,0.1)] ring-1 ring-slate-200 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_26px_64px_rgba(15,23,42,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
    >
      <div className="space-y-3">
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <span className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-white px-5 py-2 text-sm font-bold text-slate-900 shadow-[0_8px_24px_rgba(15,23,42,0.15)] transition-all duration-300 group-hover:translate-x-1 group-hover:shadow-[0_12px_32px_rgba(15,23,42,0.2)]">
        {cta}
        <svg
          aria-hidden="true"
          className="h-4 w-4 text-slate-500 transition-transform duration-300 group-hover:translate-x-1"
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
    </Link>
  );
}

export default function JobseekerDashboard({ greetingName }) {
  const heading = greetingName ? `Welcome back, ${greetingName}` : "Welcome back";

  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-slate-100">
      <section className="bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-16 text-center sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Jobseeker Dashboard</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{heading}</h1>
          <p className="max-w-3xl text-base text-slate-500 sm:text-lg">
            Keep your profile updated, search for fresh opportunities, and monitor your application status.
          </p>
        </div>
      </section>

      <section className="-mt-8 pb-20">
        <div className="mx-auto max-w-6xl px-6 sm:px-8">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <DashboardCard key={card.href} {...card} />
            ))}
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

  const baseGreeting = session.user?.name?.trim?.() || "";

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        firstName: true,
        lastName: true,
      },
    });

    const profileName = [profile?.firstName, profile?.lastName]
      .map((value) => (value ? String(value).trim() : ""))
      .filter(Boolean)
      .join(" ");

    return {
      props: {
        greetingName: profileName || baseGreeting,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        greetingName: baseGreeting,
      },
    };
  }
}
