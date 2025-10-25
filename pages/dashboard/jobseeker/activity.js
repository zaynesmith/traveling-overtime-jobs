import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function formatDateTime(value) {
  if (!value) return "No recent activity";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No recent activity";
  return date.toLocaleString();
}

export default function ActivityPage({ lastActive, bumpEligible }) {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Activity</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Stay visible to employers</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Manage your visibility, bump your profile to the top of searches, and review recent activity.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <dl className="grid gap-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Last active</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">{formatDateTime(lastActive)}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-wide text-slate-500">Profile bump</dt>
              <dd className="mt-2 text-lg font-semibold text-slate-900">
                {bumpEligible ? "Available now" : "Available again soon"}
              </dd>
            </div>
          </dl>

          <button className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60" disabled={!bumpEligible}>
            {bumpEligible ? "Boost profile visibility" : "Profile bump cooling down"}
          </button>
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

    const lastActive = profile?.lastActive ? profile.lastActive.toISOString?.() ?? profile.lastActive : null;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const bumpEligible = !lastActive || Date.now() - new Date(lastActive).getTime() >= sevenDaysMs;

    return {
      props: { lastActive, bumpEligible },
    };
  } catch (error) {
    console.error(error);
    return {
      props: { lastActive: null, bumpEligible: true },
    };
  }
}
