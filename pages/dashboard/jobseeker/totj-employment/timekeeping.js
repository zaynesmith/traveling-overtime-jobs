import Link from "next/link";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import TimekeepingHomeCard from "@/components/jobseeker/TimekeepingHomeCard";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";

function isPhaseTwoJobseeker(session) {
  const email = String(session?.user?.email || "").toLowerCase();
  return session?.user?.role === "jobseeker" && email === PHASE_II_EMAIL;
}

export default function TimekeepingPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Timekeeping</h1>
          <Link href="/dashboard/jobseeker/totj-employment" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Back
          </Link>
        </div>
        <TimekeepingHomeCard />
      </section>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/jobseeker/login", permanent: false } };
  if (!isPhaseTwoJobseeker(session)) return { redirect: { destination: "/dashboard/jobseeker", permanent: false } };
  return { props: {} };
}
