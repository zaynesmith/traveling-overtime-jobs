import { useMemo, useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import CandidateCard from "@/components/employer/CandidateCard";

export default function SavedCandidatesPage({ saved, employerId }) {
  const [savedCandidates, setSavedCandidates] = useState(saved || []);
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [error, setError] = useState(null);

  const employerIdentifier = employerId || null;

  const savedIds = useMemo(
    () => new Set(savedCandidates.map((candidate) => candidate.jobseekerId)),
    [savedCandidates]
  );

  const handleRemove = async (jobseekerId) => {
    if (!jobseekerId || pendingIds.has(jobseekerId)) return;

    const candidateToRestore =
      savedCandidates.find(
        (candidate) => candidate.jobseekerId === jobseekerId
      ) || null;

    setPendingIds((prev) => {
      const updated = new Set(prev);
      updated.add(jobseekerId);
      return updated;
    });
    setError(null);
    setSavedCandidates((prev) =>
      prev.filter((candidate) => candidate.jobseekerId !== jobseekerId)
    );

    try {
      const response = await fetch("/api/employer/save-candidate", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employer_id: employerIdentifier,
          jobseeker_id: jobseekerId,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to remove saved candidate");
      }
    } catch (err) {
      setSavedCandidates((prev) =>
        candidateToRestore ? [candidateToRestore, ...prev] : prev
      );
      setError(err.message || "Unable to remove saved candidate");
    } finally {
      setPendingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(jobseekerId);
        return updated;
      });
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
            Saved Candidates
          </p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
            Bookmark your top prospects
          </h1>
          <p className="max-w-2xl text-base text-slate-600">
            Reach back out to traveling professionals you&apos;ve saved and move
            them forward in your hiring process.
          </p>
        </header>

        {error ? (
          <p className="text-sm font-medium text-rose-600">{error}</p>
        ) : null}

        {savedCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">
              You haven&apos;t saved any candidates yet.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Search the resume database and bookmark promising talent.
            </p>
            <Link
              href="/dashboard/employer/resume-search"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
            >
              Start searching
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
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {savedCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.jobseekerId}
                candidate={candidate}
                isSaved={savedIds.has(candidate.jobseekerId)}
                isPending={pendingIds.has(candidate.jobseekerId)}
                onToggleSave={() => handleRemove(candidate.jobseekerId)}
                buttonLabels={{
                  saved: "Remove",
                  unsaved: "Save Candidate",
                  saving: "Saving...",
                  removing: "Removing...",
                }}
              />
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
    const destination =
      session.user?.role === "jobseeker"
        ? "/dashboard/jobseeker"
        : "/";
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
      select: { id: true },
    });

    if (!employerProfile) {
      return {
        redirect: {
          destination: "/dashboard/employer",
          permanent: false,
        },
      };
    }

    const saved = await prisma.saved_candidates.findMany({
      where: { employer_id: employerProfile.id },
      include: {
        jobseekerprofile: true,
      },
      orderBy: { saved_at: "desc" },
    });

    const formatted = saved
      .filter((entry) => Boolean(entry.jobseekerprofile))
      .map((entry) => {
        const profile = entry.jobseekerprofile;
        const fullName =
          [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
          "Unnamed candidate";
        const locationParts = [profile?.city, profile?.state].filter(Boolean);

        return {
          jobseekerId: profile?.id || entry.jobseeker_id,
          profileId: profile?.id || entry.jobseeker_id,
          fullName,
          trade: profile?.trade || null,
          location: locationParts.length ? locationParts.join(", ") : null,
          phone: profile?.phone || null,
          lastActive: profile?.lastActive
            ? profile.lastActive.toISOString()
            : null,
          resumeUpdated: profile?.updatedAt
            ? profile.updatedAt.toISOString()
            : null,
          resumeUrl: profile?.resumeUrl || null,
          savedAt: entry.saved_at ? entry.saved_at.toISOString() : null,
        };
      });

    return {
      props: { saved: formatted, employerId: employerProfile.id },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { saved: [], employerId: null },
    };
  }
}
