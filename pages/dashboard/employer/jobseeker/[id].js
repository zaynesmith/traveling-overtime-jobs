import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { getSupabaseServiceClient } from "@/lib/supabaseServer";

export default function EmployerJobseekerProfilePage({ profile }) {
  if (!profile) {
    return (
      <main className="bg-slate-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-slate-900">Profile unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">This jobseeker profile could not be located.</p>
        </div>
      </main>
    );
  }

  const rows = [
    { label: "Name", value: profile.fullName || "Not provided" },
    { label: "Email", value: profile.email || "Not provided" },
    { label: "Phone", value: profile.phone || "Not provided" },
    { label: "Trade", value: profile.trade || "Not selected" },
    { label: "Location", value: profile.location || "Not provided" },
    { label: "Certifications / Licenses", value: profile.certifications || "Not provided" },
    { label: "Resume", value: profile.resumeUrl ? "Uploaded" : "Missing" },
  ];

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Jobseeker Profile</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">{profile.fullName || "Candidate overview"}</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Review the candidate&apos;s submitted information and supporting credentials before reaching out.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <ul className="divide-y divide-slate-200 text-sm text-slate-700">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-slate-900">{row.label}</span>
                <span className="sm:max-w-xs sm:text-right">{row.value}</span>
              </li>
            ))}
          </ul>

          {profile.resumeUrl ? (
            <a
              href={profile.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-600"
            >
              View uploaded resume
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          ) : (
            <p className="mt-6 text-sm font-medium text-rose-600">This candidate has not uploaded a resume yet.</p>
          )}

          <div className="mt-8 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900">Supporting documents</h2>
            {profile.documents.length ? (
              <ul className="space-y-2 text-sm text-slate-700">
                {profile.documents.map((doc) => (
                  <li key={doc.path} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                    <span className="truncate" title={doc.name}>
                      {doc.name}
                    </span>
                    {doc.url ? (
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-sky-600"
                      >
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Unavailable</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">No supporting documents provided.</p>
            )}
          </div>
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

  const { id } = context.params || {};

  try {
    const { default: prisma } = await import("@/lib/prisma");

    const jobseekerProfile = await prisma.jobseekerProfile.findUnique({
      where: { id },
    });

    if (!jobseekerProfile) {
      return { notFound: true };
    }

    const locationParts = [jobseekerProfile.city, jobseekerProfile.state].filter(Boolean);

    const supabase = getSupabaseServiceClient();
    let documents = [];

    if (Array.isArray(jobseekerProfile.certFiles) && jobseekerProfile.certFiles.length) {
      documents = await Promise.all(
        jobseekerProfile.certFiles.map(async (path) => {
          const name = path.split("/").pop() || path;

          if (!supabase) {
            return { path, name, url: null };
          }

          try {
            const { data, error } = await supabase.storage.from("certifications").createSignedUrl(path, 60 * 60);
            if (error) {
              console.error(error);
              return { path, name, url: null };
            }
            return { path, name, url: data?.signedUrl || null };
          } catch (error) {
            console.error(error);
            return { path, name, url: null };
          }
        })
      );
    }

    const profile = {
      id: jobseekerProfile.id,
      fullName: [jobseekerProfile.firstName, jobseekerProfile.lastName].filter(Boolean).join(" ") || "",
      email: jobseekerProfile.email || "",
      phone: jobseekerProfile.phone || "",
      trade: jobseekerProfile.trade || "",
      location: locationParts.length ? locationParts.join(", ") : "",
      resumeUrl: jobseekerProfile.resumeUrl || "",
      certifications: jobseekerProfile.certifications || "",
      documents,
    };

    return {
      props: { profile },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { profile: null },
    };
  }
}
