import { useState } from "react";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";

export default function JobseekerSettingsPage({ preferences }) {
  const [form, setForm] = useState(preferences);
  const [message, setMessage] = useState(null);

  const handleChange = (event) => {
    const { name, checked } = event.target;
    setForm((current) => ({ ...current, [name]: checked }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage("Settings saved (demo)");
  };

  return (
    <main className="bg-slate-50 py-12">
      <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 sm:px-6 lg:px-8">
        <header className="space-y-2 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">Settings</p>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Fine-tune your account</h1>
          <p className="max-w-2xl text-base text-slate-600">
            Control alerts, privacy, and visibility preferences from one easy panel.
          </p>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-lg">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-900">Job alerts</legend>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="emailAlerts" checked={form.emailAlerts} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Email me new jobs that match my trade
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="smsAlerts" checked={form.smsAlerts} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Send SMS alerts for urgent openings
              </label>
            </fieldset>

            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-slate-900">Privacy</legend>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="showProfile" checked={form.showProfile} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Allow employers to view my full profile
              </label>
              <label className="flex items-center gap-3 text-sm text-slate-700">
                <input type="checkbox" name="shareResume" checked={form.shareResume} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500" />
                Share my resume with saved employers
              </label>
            </fieldset>

            {message ? <p className="text-sm font-medium text-emerald-600">{message}</p> : null}

            <div className="flex justify-end gap-3">
              <button type="submit" className="rounded-xl bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500">
                Save preferences
              </button>
            </div>
          </form>
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

  return {
    props: {
      preferences: {
        emailAlerts: true,
        smsAlerts: false,
        showProfile: true,
        shareResume: true,
      },
    },
  };
}
