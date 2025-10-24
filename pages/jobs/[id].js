import { useState } from "react";
import { useSession } from "next-auth/react";

const detailPanelClasses =
  "bg-white border border-gray-200 rounded-2xl shadow-xl p-8";

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
      <main className="min-h-screen bg-gray-100 py-16">
        <div className="mx-auto mt-10 max-w-md px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-xl">
            <h1 className="text-3xl font-bold text-slate-900">Job not found</h1>
            <p className="mt-4 text-base text-slate-600">
              The listing you&apos;re looking for may have been removed.
            </p>
          </div>
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
  const employerLocation = job.employerLocation || job.location || job.zip || "Location TBD";
  const requirementsText = job.requirements || job.qualifications || "Requirements not provided.";

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <article className="mx-auto mt-10 mb-16 max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className={detailPanelClasses}>
          <header className="border-b border-gray-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              {job.trade || "General"}
            </p>
            <h1 className="mt-3 text-3xl font-bold text-slate-900">{job.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-slate-600">
              {job.payrate ? (
                <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-semibold text-sky-700">
                  {job.payrate}
                </span>
              ) : null}
              <span>{employerLocation}</span>
              {job.posted_at ? (
                <span className="text-slate-500">Posted {formatDate(job.posted_at)}</span>
              ) : null}
            </div>
          </header>

          <section className="border-b border-gray-200 py-6">
            <h2 className="text-lg font-semibold text-slate-900">Description</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {job.description || "No description provided."}
            </p>
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <h3 className="text-sm font-semibold text-slate-900">Company</h3>
              <p className="mt-1 text-sm text-slate-700">
                {job.employerName || "Private listing"}
              </p>
              <p className="text-sm text-slate-500">{employerLocation}</p>
            </div>
          </section>

          <section className="border-b border-gray-200 py-6">
            <h2 className="text-lg font-semibold text-slate-900">Requirements</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
              {requirementsText}
            </p>
          </section>

          <footer className="pt-6">
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
                className="mt-6 inline-block rounded-lg bg-sky-600 px-6 py-3 text-white font-semibold hover:bg-sky-500 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending application…" : "Apply Now"}
              </button>
            ) : (
              <p className="mt-6 text-sm text-slate-500">
                Sign in as a jobseeker to apply for this position.
              </p>
            )}
          </footer>
        </div>
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
