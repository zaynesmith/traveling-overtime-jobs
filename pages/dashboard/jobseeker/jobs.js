import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { normalizeTrade } from "@/lib/trades";

function JobCard({ job }) {
  const location = [job.city, job.state].filter(Boolean).join(", ") || job.location || job.zip || "";
  const trade = normalizeTrade(job.trade) || "General";

  return (
    <li className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl">
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{job.title}</h2>
          <p className="text-sm font-medium uppercase tracking-wide text-slate-500">{trade}</p>
          {location ? <p className="text-sm text-slate-600">{location}</p> : null}
        </div>
        {job.hourlyPay || job.perDiem ? (
          <p className="text-sm text-slate-600">
            {job.hourlyPay ? `Pay: ${job.hourlyPay}` : null}
            {job.hourlyPay && job.perDiem ? " • " : ""}
            {job.perDiem ? `Per diem: ${job.perDiem}` : null}
          </p>
        ) : null}
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
        >
          View details
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </li>
  );
}

export default function JobseekerJobsPage({ jobs }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Job Search</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Explore the latest opportunities</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Discover new assignments tailored to your trade and preferred locations.
          </p>
        </header>

        {jobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">No jobs posted yet.</p>
            <p className="mt-2 text-sm text-slate-600">Check back soon for fresh travel assignments.</p>
          </div>
        ) : (
          <ul className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </ul>
        )}
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
    const jobs = await prisma.jobs.findMany({
      orderBy: { posted_at: "desc" },
      take: 12,
    });

    const formatted = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      trade: job.trade,
      city: job.city,
      state: job.state,
      location: job.location,
      zip: job.zip,
      hourlyPay: job.hourlyPay,
      perDiem: job.perDiem,
    }));

    return {
      props: { jobs: formatted },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { jobs: [] },
    };
  }
}
