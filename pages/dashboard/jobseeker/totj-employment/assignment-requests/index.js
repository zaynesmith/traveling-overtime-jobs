import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const PHASE_II_EMAIL = "zayne.smith18@gmail.com";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function isPhaseTwoJobseeker(session) {
  const email = String(session?.user?.email || "").toLowerCase();
  return session?.user?.role === "jobseeker" && email === PHASE_II_EMAIL;
}

async function safeRaw(query) {
  try {
    const result = await prisma.$queryRaw(query);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Assignment request list query failed", error);
    return [];
  }
}

export default function AssignmentRequestsPage({ requests }) {
  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <section className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">TOTJ Employment</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">All Assignment Requests</h1>
            </div>
            <Link
              href="/dashboard/jobseeker/totj-employment"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
            >
              Back
            </Link>
          </div>

          {requests.length ? (
            <ul className="mt-6 space-y-4">
              {requests.map((request) => (
                <li key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Employer: {request.employer_company_name || request.employer_id || "Unknown"}
                      </p>
                      <p className="text-sm text-slate-600">Status: {request.status || "pending"}</p>
                      <p className="text-sm text-slate-600">Sent: {formatDate(request.sent_at)}</p>
                    </div>
                    <Link
                      href={`/dashboard/jobseeker/totj-employment/assignment-requests/${request.id}`}
                      className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-200"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-slate-600">No assignment requests found.</p>
          )}
        </div>
      </section>
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

  if (!isPhaseTwoJobseeker(session)) {
    return {
      redirect: {
        destination: "/dashboard/jobseeker",
        permanent: false,
      },
    };
  }

  const profile = await prisma.jobseekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile?.id) {
    return { props: { requests: [] } };
  }

  const requests = await safeRaw(Prisma.sql`
    SELECT
      ar.id,
      ar.employer_id,
      ar.status,
      ar.sent_at,
      ep."companyName" AS employer_company_name
    FROM public.assignment_requests ar
    LEFT JOIN public.employerprofile ep ON ep.id = ar.employer_id
    WHERE ar.jobseeker_id = ${profile.id}::uuid
    ORDER BY ar.sent_at DESC NULLS LAST, ar.created_at DESC NULLS LAST
  `);

  return { props: { requests } };
}
