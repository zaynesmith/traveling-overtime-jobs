import { useState } from "react";
import { useSession } from "next-auth/react";
import { normalizeTrade } from "@/lib/trades";

const detailPanelClasses =
  "bg-white border border-gray-100 rounded-3xl shadow-2xl p-10";

function formatJobLocation(job) {
  if (!job) return "";
  const cityState = [job.city, job.state].filter(Boolean).join(", ");
  const parts = [cityState, job.zip].filter(Boolean);
  if (parts.length) {
    return parts.join(" ");
  }
  return job.location || job.zip || "";
}

function formatJobHighlights(job) {
  if (!job) return "";
  const tradeName = normalizeTrade(job.trade) || job.trade || "Trade not specified";
  const hourly = job.hourly_pay || "Hourly pay not provided";
  const perDiem = job.per_diem || "Per diem not provided";
  return [tradeName, hourly, perDiem].join(" • ");
}

export default function JobDetails({ job }) {
  const { data: session } = useSession();
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

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

      if (response.status === 409) {
        setHasApplied(true);
        setStatus({
          type: "info",
          message: payload?.error || "You have already applied to this job.",
        });
        return;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Application failed");
      }

      setHasApplied(true);
      setStatus({ type: "success", message: "Application sent!" });
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Unable to apply" });
    } finally {
      setSubmitting(false);
    }
  };

  const isJobseeker = session?.user?.role === "jobseeker";
  const canApply = isJobseeker;
  const disableApplyButton = submitting || hasApplied;
  const listingLocation = formatJobLocation(job) || job.employerLocation || "Location TBD";
  const requirementsText =
    job.additional_requirements ||
    job.requirements ||
    job.qualifications ||
    "Requirements not provided.";
  const jobHighlights = formatJobHighlights(job);
  const contactItems = [
    {
      key: "firstName",
      label: "First Name",
      value: job.contactFirstName,
      isVisible: Boolean(job.showFirstName && job.contactFirstName),
    },
    {
      key: "email",
      label: "Email",
      value: job.contactEmail,
      isVisible: Boolean(job.showEmail && job.contactEmail),
    },
    {
      key: "phone",
      label: "Mobile Phone",
      value: job.contactPhone,
      isVisible: Boolean(job.showPhone && job.contactPhone),
    },
  ];
  const visibleContactItems = contactItems.filter((item) => item.isVisible);
  const alertStyles = {
    success: "bg-emerald-100 text-emerald-700",
    info: "bg-sky-100 text-sky-700",
    error: "bg-rose-100 text-rose-700",
  };

  return (
    <main className="min-h-screen bg-gray-100 py-12">
      <article className="mx-auto mt-10 mb-16 max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className={detailPanelClasses}>
          <header className="text-center">
            <h1 className="text-4xl font-bold text-slate-900">{job.title}</h1>
            <p className="mt-3 text-lg font-semibold text-slate-700">
              {job.employerName || "Private listing"}
            </p>
            <p className="mt-2 text-sm text-slate-500">{listingLocation}</p>
            <p className="mt-4 text-base font-medium text-slate-600">
              {jobHighlights}
            </p>
          </header>

          <div className="mt-10 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {job.description || "No description provided."}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Additional Requirements</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {requirementsText}
              </p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-left">
              <h2 className="text-xl font-semibold text-slate-900">Contact Details</h2>
              {!isJobseeker ? (
                <p className="mt-3 text-sm text-slate-500">
                  Sign in as a jobseeker to view employer contact information.
                </p>
              ) : visibleContactItems.length ? (
                <dl className="mt-3 space-y-3 text-sm text-slate-700">
                  {visibleContactItems.map((item) => (
                    <div key={item.key}>
                      <dt className="font-semibold text-slate-700">{item.label}</dt>
                      <dd className="mt-1 text-slate-700">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 text-sm text-slate-500">
                  The employer has not shared contact information for this listing.
                </p>
              )}
            </section>
          </div>

          <footer className="mt-10 flex flex-col items-center">
            {status ? (
              <div
                className={`mb-4 w-full max-w-md rounded-lg px-4 py-3 text-center text-sm font-semibold ${
                  alertStyles[status.type] || alertStyles.error
                }`}
              >
                {status.message}
              </div>
            ) : null}
            {canApply ? (
              <button
                onClick={handleApply}
                disabled={disableApplyButton}
                className="w-full max-w-md rounded-full bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Sending application…"
                  : hasApplied
                  ? "Application submitted"
                  : "Apply Now"}
              </button>
            ) : (
              <p className="w-full max-w-md text-center text-sm text-slate-500">
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
            firstName: true,
            mobilePhone: true,
            phone: true,
            officePhone: true,
            user: { select: { email: true } },
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
          trade: normalizeTrade(job.trade),
          employerName: job.employerprofile?.companyName || null,
          employerLocation: employerLocation || null,
          showFirstName: job.showFirstName || false,
          showEmail: job.showEmail || false,
          showPhone: job.showPhone || false,
          contactFirstName: job.employerprofile?.firstName || null,
          contactEmail: job.employerprofile?.user?.email || null,
          contactPhone:
            job.employerprofile?.mobilePhone ||
            job.employerprofile?.phone ||
            job.employerprofile?.officePhone ||
            null,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return { props: { job: null } };
  }
}
