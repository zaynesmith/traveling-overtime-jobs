import { useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

function formatDate(value) {
  if (!value) return "No activity yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No activity yet";
  return date.toLocaleDateString();
}

export default function ActivityPage({ lastActive, bumpEligible }) {
  const [lastActiveDate, setLastActiveDate] = useState(lastActive);
  const [eligible, setEligible] = useState(bumpEligible);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBump = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/profile/bump", { method: "POST" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to bump profile");
      }
      setLastActiveDate(payload.lastActive || new Date().toISOString());
      setEligible(false);
      setMessage({ type: "success", text: "Resume bumped! You&apos;re back on top." });
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Unable to bump profile" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Activity</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Stay visible to employers</h1>
          <p className="text-sm text-slate-600">
            Bump your profile to return to the top of employer searches once every seven days.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-lg space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-700">Last active</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{formatDate(lastActiveDate)}</p>
          </div>

          {message ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                message.type === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {message.text}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleBump}
            disabled={!eligible || loading}
            className="w-full rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Bumping..." : eligible ? "Bump my resume" : "Available again soon"}
          </button>

          {!eligible ? (
            <p className="text-xs text-slate-500">
              Resume bumps unlock every seven days. Check back soon to stay on top of employer searches.
            </p>
          ) : null}
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
      select: { lastActive: true },
    });

    const lastActive = profile?.lastActive ? profile.lastActive.toISOString?.() ?? profile.lastActive : null;
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const bumpEligible = !lastActive || Date.now() - new Date(lastActive).getTime() >= sevenDaysMs;

    return {
      props: {
        lastActive,
        bumpEligible,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        lastActive: null,
        bumpEligible: true,
      },
    };
  }
}
