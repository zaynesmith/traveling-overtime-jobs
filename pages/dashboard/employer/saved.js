import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

export default function SavedCandidatesPage({ saved }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Saved Candidates</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Bookmark your top prospects</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Reach back out to traveling professionals you&apos;ve saved and move them forward in your hiring process.
          </p>
        </header>

        {saved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">You haven&apos;t saved any candidates yet.</p>
            <p className="mt-2 text-sm text-slate-600">Search the resume database and bookmark promising talent.</p>
            <Link
              href="/dashboard/employer/resume-search"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Start searching
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {saved.map((candidate) => (
              <li key={candidate.id} className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{candidate.name}</p>
                    <p className="text-sm text-slate-600">{candidate.trade || "General"} • {candidate.location}</p>
                  </div>
                  {candidate.resumeUrl ? (
                    <a
                      href={candidate.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
                    >
                      View resume
                      <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </a>
                  ) : null}
                </div>
              </li>
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
        destination: "/employer/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "employer") {
    const destination = session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const saved = await prisma.saved_candidates.findMany({
      where: { employerprofile: { userId: session.user.id } },
      include: {
        jobseekerprofile: true,
      },
      orderBy: { saved_at: "desc" },
    });

    const formatted = saved.map((entry) => ({
      id: entry.id,
      name: [entry.jobseekerprofile?.firstName, entry.jobseekerprofile?.lastName].filter(Boolean).join(" ") || "Unnamed candidate",
      trade: entry.jobseekerprofile?.trade,
      location: [entry.jobseekerprofile?.city, entry.jobseekerprofile?.state].filter(Boolean).join(", "),
      resumeUrl: entry.jobseekerprofile?.resumeUrl || null,
    }));

    return {
      props: { saved: formatted },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { saved: [] },
    };
  }
}
