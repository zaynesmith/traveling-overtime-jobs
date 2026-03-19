import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";

function isPhaseTwoJobseeker(session) {
  const email = String(session?.user?.email || "").toLowerCase();
  return session?.user?.role === "jobseeker" && email === PHASE_II_EMAIL;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function VerificationPage({ verification }) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Employment Verification</h1>
          <Link href="/dashboard/jobseeker/totj-employment" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Back
          </Link>
        </div>

        {verification ? (
          <dl className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-900">Status</dt>
              <dd>{verification.status || "pending"}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Updated</dt>
              <dd>{formatDate(verification.updated_at || verification.created_at)}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-6 text-sm text-slate-600">No verification records found yet.</p>
        )}
      </section>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/jobseeker/login", permanent: false } };
  if (!isPhaseTwoJobseeker(session)) return { redirect: { destination: "/dashboard/jobseeker", permanent: false } };

  const profile = await prisma.jobseekerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!profile?.id) return { props: { verification: null } };

  const rows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT *
      FROM public.employment_verification
      WHERE jobseeker_id = ${profile.id}::uuid
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1
    `,
  );

  return { props: { verification: rows?.[0] || null } };
}
