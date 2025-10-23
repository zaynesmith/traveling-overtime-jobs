import { useState } from "react";
import { useSession } from "next-auth/react";

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
      <main className="min-h-screen bg-slate-900 py-16 px-6 text-center text-slate-200">
        <h1 className="text-3xl font-bold">Job not found</h1>
        <p className="mt-4 text-slate-400">The listing you&apos;re looking for may have been removed.</p>
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
    <main className="min-h-screen bg-slate-900 py-12 px-4 sm:px-8 lg:px-16">
      <article className="mx-auto max-w-4xl rounded-xl border border-slate-700 bg-slate-800 p-8 shadow-lg">
        <header className="border-b border-slate-700 pb-6">
          <p className="text-sm uppercase tracking-widest text-amber-400">{job.trade || "General"}</p>
          <h1 className="mt-2 text-3xl font-bold text-white">{job.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-300">
            {job.payrate ? (
              <span className="rounded bg-amber-500/20 px-3 py-1 text-sm font-semibold text-amber-300">
                {job.payrate}
              </span>
            ) : null}
            {job.location || job.zip ? (
              <span>{job.location || job.zip}</span>
            ) : (
              <span>Location TBD</span>
            )}
            {job.posted_at ? (
              <span className="text-slate-400">Posted {formatDate(job.posted_at)}</span>
            ) : null}
          </div>
        </header>

        <section className="mt-6 space-y-6 text-slate-200">
          <p className="whitespace-pre-line leading-relaxed text-slate-200">
            {job.description || "No description provided."}
          </p>

          <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold text-white">Employer</h2>
            <p className="text-slate-300">{job.employerName || "Private listing"}</p>
            {job.employerLocation ? (
              <p className="text-sm text-slate-400">{job.employerLocation}</p>
            ) : null}
          </div>
        </section>

        <footer className="mt-8 border-t border-slate-700 pt-6">
          {status ? (
            <div
              className={`mb-4 rounded-md px-4 py-3 text-sm font-semibold ${
                status.type === "success"
                  ? "bg-emerald-500/20 text-emerald-200"
                  : "bg-red-500/20 text-red-200"
              }`}
            >
              {status.message}
            </div>
          ) : null}
          {canApply ? (
            <button
              onClick={handleApply}
              disabled={submitting}
              className="w-full rounded-md bg-amber-500 py-3 text-lg font-semibold text-slate-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending application…" : "Apply Now"}
            </button>
          ) : (
            <p className="text-center text-sm text-slate-400">
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
