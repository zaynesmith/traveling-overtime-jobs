import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

export default function JobseekerProfilePage({ profile }) {
  const rows = [
    { label: "Name", value: [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Not provided" },
    { label: "Email", value: profile.email || "Not provided" },
    { label: "Trade", value: profile.trade || "Not selected" },
    { label: "Location", value: [profile.city, profile.state].filter(Boolean).join(", ") || "Not provided" },
    { label: "Resume", value: profile.resumeUrl ? "Uploaded" : "Missing" },
  ];

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Profile</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Keep your info up to date</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Employers see your profile first—fill in every field and keep your resume current to stay competitive.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <ul className="divide-y divide-slate-200 text-sm text-slate-700">
            {rows.map((row) => (
              <li key={row.label} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <span className="font-semibold text-slate-900">{row.label}</span>
                <span>{row.value}</span>
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
            <p className="mt-6 text-sm font-medium text-rose-600">Add a resume to boost your visibility.</p>
          )}
        </section>

        <div className="flex justify-end">
          <Link
            href="/dashboard/jobseeker/settings"
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500"
          >
            Edit profile settings
          </Link>
        </div>
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
    const profile = await prisma.jobseekerProfile.findUnique({
      where: { userId: session.user.id },
    });

    return {
      props: {
        profile: {
          firstName: profile?.firstName || "",
          lastName: profile?.lastName || "",
          email: profile?.email || session.user.email || "",
          trade: profile?.trade || "",
          city: profile?.city || "",
          state: profile?.state || "",
          resumeUrl: profile?.resumeUrl || "",
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        profile: {
          firstName: "",
          lastName: "",
          email: session.user.email || "",
          trade: "",
          city: "",
          state: "",
          resumeUrl: "",
        },
      },
    };
  }
}
