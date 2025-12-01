import { useMemo, useState } from "react";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import CandidateCard from "@/components/employer/CandidateCard";

export default function ApplicantsPage({ jobTitle, applicants, employerId, initialSavedIds }) {
  const [savedIds, setSavedIds] = useState(() => new Set(initialSavedIds || []));
  const [pendingIds, setPendingIds] = useState(() => new Set());
  const [saveError, setSaveError] = useState(null);

  const employerIdentifier = employerId || null;

  const toggleSave = async (jobseekerId) => {
    if (!jobseekerId || pendingIds.has(jobseekerId)) return;

    const currentlySaved = savedIds.has(jobseekerId);
    const nextSaved = new Set(savedIds);
    if (currentlySaved) {
      nextSaved.delete(jobseekerId);
    } else {
      nextSaved.add(jobseekerId);
    }

    setSavedIds(nextSaved);
    setPendingIds((prev) => {
      const updated = new Set(prev);
      updated.add(jobseekerId);
      return updated;
    });
    setSaveError(null);

    try {
      const response = await fetch("/api/employer/save-candidate", {
        method: currentlySaved ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: employerIdentifier, jobseeker_id: jobseekerId }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to update saved candidate");
      }
    } catch (error) {
      setSavedIds((prev) => {
        const revert = new Set(prev);
        if (currentlySaved) {
          revert.add(jobseekerId);
        } else {
          revert.delete(jobseekerId);
        }
        return revert;
      });
      setSaveError(error.message || "Unable to update saved candidate");
    } finally {
      setPendingIds((prev) => {
        const updated = new Set(prev);
        updated.delete(jobseekerId);
        return updated;
      });
    }
  };

  const applicantsWithDetails = useMemo(
    () =>
      applicants.map((applicant) => ({
        ...applicant,
        cardId: applicant.jobseekerId || applicant.applicationId,
      })),
    [applicants]
  );

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl bg-white p-6 shadow-lg">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Applicants</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{jobTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Review candidates who&apos;ve applied to this job.
          </p>
        </header>

        {saveError ? <p className="text-sm font-medium text-rose-600">{saveError}</p> : null}

        {applicantsWithDetails.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-lg">
            <p className="text-lg font-semibold text-slate-900">
              No applicants have applied to this job yet.
            </p>
            <Link
              href="/dashboard/employer/posted-jobs"
              className="mt-2 inline-block text-sm font-semibold text-sky-600"
            >
              Back to posted jobs
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {applicantsWithDetails.map((applicant) => (
              <CandidateCard
                key={applicant.cardId}
                candidate={applicant}
                isSaved={savedIds.has(applicant.jobseekerId)}
                isPending={pendingIds.has(applicant.jobseekerId)}
                onToggleSave={() => toggleSave(applicant.jobseekerId)}
                buttonLabels={{
                  saved: "Saved",
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
      session.user?.role === "jobseeker" ? "/dashboard/jobseeker" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  const { jobId } = context.params || {};

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

    const job = await prisma.jobs.findFirst({
      where: { id: jobId, employer_id: employerProfile.id },
      select: {
        id: true,
        title: true,
        applications: {
          orderBy: { applied_at: "desc" },
          select: {
            id: true,
            jobseeker_id: true,
            viewed_at: true,
            jobseekerprofile: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                trade: true,
                city: true,
                state: true,
                phone: true,
                resumeUrl: true,
                lastActive: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      return {
        notFound: true,
      };
    }

    await prisma.applications.updateMany({
      where: { job_id: jobId, viewed_at: null },
      data: { viewed_at: new Date() },
    });

    const applicants = job.applications
      .filter((application) => Boolean(application.jobseekerprofile))
      .map((application) => {
        const profile = application.jobseekerprofile;
        const fullName =
          [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
          "Unnamed candidate";
        const locationParts = [profile?.city, profile?.state].filter(Boolean);

        return {
          applicationId: application.id,
          jobseekerId: profile?.id || application.jobseeker_id,
          profileId: profile?.id || application.jobseeker_id,
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
        };
      });

    const savedEntries = await prisma.saved_candidates.findMany({
      where: { employer_id: employerProfile.id },
      select: { jobseeker_id: true },
    });

    const initialSavedIds = savedEntries
      .map((entry) => entry.jobseeker_id)
      .filter((value) => typeof value === "string");

    return {
      props: {
        jobTitle: job.title,
        applicants,
        employerId: employerProfile.id,
        initialSavedIds,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        jobTitle: "Applicants",
        applicants: [],
        employerId: null,
        initialSavedIds: [],
      },
    };
  }
}
