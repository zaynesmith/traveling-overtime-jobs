import { useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

export default function SavedCandidatesPage({ initialSaved }) {
  const [savedCandidates, setSavedCandidates] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/candidates/save");
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load saved candidates");
      }
      setSavedCandidates(Array.isArray(payload?.saved) ? payload.saved : []);
    } catch (err) {
      setError(err.message || "Unable to load saved candidates");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Saved Candidates</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Keep tabs on your shortlist</h1>
          <p className="text-sm text-slate-600">
            Quickly revisit profiles you&apos;ve bookmarked for future assignments.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleRefresh}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh list"}
            </button>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {savedCandidates.length} saved candidate{savedCandidates.length === 1 ? "" : "s"}
            </span>
          </div>

          {error ? (
            <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
          ) : null}

          {savedCandidates.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              You haven&apos;t saved any candidates yet. Browse the <Link className="font-semibold text-sky-600" href="/dashboard/employer/resume-search">resume search</Link> to get started.
            </div>
          ) : (
            <ul className="space-y-5">
              {savedCandidates.map((item) => {
                const profile = item.jobseekerprofile || {};
                const resumeUrl = profile.resumeUrl || profile.resumeurl || profile.resumeURL;
                const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Unnamed Candidate";
                return (
                  <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900">{fullName}</h2>
                        <p className="text-sm text-slate-600">{profile.trade || "Various trades"}</p>
                        <p className="text-xs text-slate-500">Saved {formatDate(item.saved_at)}</p>
                      </div>
                      {resumeUrl ? (
                        <a
                          href={resumeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
                        >
                          View resume
                          <svg
                            aria-hidden="true"
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path d="M7 17l9-9M7 7h10v10" />
                          </svg>
                        </a>
                      ) : (
                        <span className="text-xs font-medium text-slate-500">No resume uploaded</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
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
    const employerProfile = await prisma.employerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        savedCandidates: {
          orderBy: { saved_at: "desc" },
          include: {
            jobseekerprofile: true,
          },
        },
      },
    });

    const initialSaved = (employerProfile?.savedCandidates || []).map((item) => ({
      id: item.id,
      saved_at: item.saved_at?.toISOString?.() ?? item.saved_at,
      jobseekerprofile: item.jobseekerprofile,
    }));

    return {
      props: {
        initialSaved,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        initialSaved: [],
      },
    };
  }
}
