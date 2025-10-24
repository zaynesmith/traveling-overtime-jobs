import { useState } from "react";
import { useSession } from "next-auth/react";

const cardContainerClasses =
  "mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-300/60";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function JobDetails({ job }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (!job) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white py-16 px-6">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-lg shadow-slate-300/60">
          <h1 className="text-3xl font-bold text-slate-900">Job not found</h1>
          <p className="mt-4 text-base text-slate-600">
            The listing you&apos;re looking for may have been removed.
          </p>
        </div>
      </main>
    );
  }

  const handleApply = async () => {
    setSubmitting(true);
    setStatus(null);
    try {
      const response = await fetch("/api/jobs/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Application failed");
      }
      setStatus({ type: "success", message: "Application sent!" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to apply" });
    } finally {
      setSubmitting(false);
    }
  };

  const canApply = session?.user?.role === "jobseeker";

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-white py-12 px-4 sm:px-8 lg:px-16">
      <article className={cardContainerClasses}>
        <header className="border-b border-slate-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">{job.trade || "General"}</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">{job.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-600">
            {job.payrate ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">
                {job.payrate}
              </span>
            ) : null}
            {job.location || job.zip ? (
              <span>{job.location || job.zip}</span>
            ) : (
              <span>Location TBD</span>
            )}
            {job.posted_at ? (
              <span className="text-slate-500">Posted {formatDate(job.posted_at)}</span>
            ) : null}
          </div>
        </header>

        <section className="mt-6 space-y-6 text-slate-700">
          <p className="whitespace-pre-line leading-relaxed">
            {job.description || "No description provided."}
          </p>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <h2 className="text-lg font-semibold text-slate-900">Employer</h2>
            <p className="text-slate-700">{job.employerName || "Private listing"}</p>
            {job.employerLocation ? (
              <p className="text-sm text-slate-500">{job.employerLocation}</p>
            ) : null}
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6">
          {status ? (
            <div
              className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {status.message}
            </div>
          ) : null}
          {canApply ? (
            <button
              onClick={handleApply}
              disabled={submitting}
              className="w-full rounded-lg bg-amber-500 py-3 text-lg font-semibold text-slate-900 shadow-sm transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending application…" : "Apply Now"}
            </button>
          ) : (
            <p className="text-center text-sm text-slate-500">
              Sign in as a jobseeker to apply for this position.
            </p>
          )}
        </footer>
      </article>
    </main>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const job = await prisma.jobs.findUnique({
      where: { id: params.id },
      include: {
        employerprofile: {
          select: {
            companyName: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!job) {
      return { props: { job: null } };
    }

    const employerLocation = [job.employerprofile?.city, job.employerprofile?.state]
      .filter(Boolean)
      .join(", ");

    return {
      props: {
        job: {
          ...JSON.parse(JSON.stringify(job)),
          employerName: job.employerprofile?.companyName || null,
          employerLocation: employerLocation || null,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return { props: { job: null } };
  }
}
