import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

export default function SettingsPage() {
  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <header className="mb-8 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Settings</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Fine-tune your account</h1>
          <p className="text-sm text-slate-600">
            Manage alerts, privacy preferences, and account access. More controls are on the way soon.
          </p>
        </header>

        <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Job alerts</h2>
            <p className="text-sm text-slate-600">
              Email notifications for new travel jobs by trade are coming soon. For now, check the job board regularly for the latest postings.
            </p>
          </article>

          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Privacy</h2>
            <p className="text-sm text-slate-600">
              Your contact details are only shared when you apply to a position or explicitly share your resume. Reach out to support if you need to hide your profile.
            </p>
          </article>

          <article className="space-y-2">
            <h2 className="text-lg font-semibold text-slate-900">Account support</h2>
            <p className="text-sm text-slate-600">
              Need to update your email or delete your account? Email <a className="font-semibold text-sky-600" href="mailto:support@travelingovertimejobs.com">support@travelingovertimejobs.com</a> and we&apos;ll help within one business day.
            </p>
          </article>
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

  return { props: {} };
}
