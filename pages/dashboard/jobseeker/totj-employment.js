import Link from "next/link";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import prisma from "@/lib/prisma";
import TimekeepingHomeCard from "@/components/jobseeker/TimekeepingHomeCard";

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

function SectionCard({ title, children }) {
  return (
    <article className="rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5">{children}</article>
  );
}

function EmptyState({ message }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">{message}</div>
  );
}

async function safeRaw(query) {
  try {
    const result = await prisma.$queryRaw(query);
    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Phase II hub query failed", error);
    return [];
  }
}

function DashboardActionCard({ title, description, href, cta = "View", children }) {
  return (
    <Link
      href={href}
      className="group block h-full rounded-3xl bg-white/90 p-6 shadow-xl ring-1 ring-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-200"
    >
      <div className="flex h-full flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
        {children}
        <span className="mt-auto inline-flex items-center justify-center gap-2 self-start rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-colors duration-300 group-hover:bg-slate-700">
          {cta}
          <svg
            aria-hidden="true"
            className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

export default function TotjEmploymentHub({ snapshot, verification, documents, signatures, requests, assignment }) {
  const profileName = [snapshot?.firstName, snapshot?.lastName].filter(Boolean).join(" ").trim();
  const recentRequests = requests.slice(0, 3);

  return (
    <main className="bg-slate-100 pb-16">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-16 text-slate-100">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.25),transparent_55%)]" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-4 px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300">Phase II Test Hub</p>
          <h1 className="text-3xl font-bold sm:text-4xl">TOTJ Employment</h1>
          <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
            Read-only snapshot for profile, verification, documents, assignment requests, and timekeeping context.
          </p>
          <div>
            <Link
              href="/dashboard/jobseeker"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Back to dashboard
            </Link>
          </div>
        </div>
      </div>

      <section className="relative z-10 -mt-12 mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:px-8 xl:grid-cols-2">
        <SectionCard title="Application/Profile Snapshot">
          <h2 className="text-xl font-semibold text-slate-900">Application/Profile Snapshot</h2>
          {snapshot ? (
            <dl className="mt-4 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-slate-900">Name</dt>
                <dd>{profileName || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Email</dt>
                <dd>{snapshot.email || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Trade</dt>
                <dd>{snapshot.trade || "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-900">Phone</dt>
                <dd>{snapshot.phone || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-900">Profile Last Updated</dt>
                <dd>{formatDate(snapshot.updatedAt)}</dd>
              </div>
            </dl>
          ) : (
            <EmptyState message="No profile snapshot is available yet." />
          )}
        </SectionCard>

        <DashboardActionCard
          href="/dashboard/jobseeker/totj-employment/verification"
          title="Employment Verification Progress"
          description="Review your verification status and latest updates."
          cta="View"
        >
          {verification ? (
            <dl className="grid gap-2 text-sm text-slate-700">
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
            <p className="text-sm text-slate-600">No employment verification records found yet.</p>
          )}
        </DashboardActionCard>

        <DashboardActionCard
          href="/dashboard/jobseeker/totj-employment/documents"
          title="Employment Documents"
          description="Check uploaded documents and form signatures."
          cta="Manage"
        >
          <p className="text-sm text-slate-600">Documents: {documents.length}</p>
          <p className="text-sm text-slate-600">Signed forms: {signatures.length}</p>
        </DashboardActionCard>

        <SectionCard title="Assignment Requests">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Assignment Requests</h2>
              <p className="mt-1 text-sm text-slate-600">Most recent 3 assignment requests.</p>
            </div>
            <Link
              href="/dashboard/jobseeker/totj-employment/assignment-requests"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
            >
              View all
            </Link>
          </div>
          {recentRequests.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              {recentRequests.map((request) => (
                <li key={request.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">
                        Employer: {request.employer_company_name || request.employer_id || "Unknown"}
                      </p>
                      <p>Status: {request.status || "pending"}</p>
                      <p>Sent: {formatDate(request.sent_at)}</p>
                    </div>
                    <Link
                      href={`/dashboard/jobseeker/totj-employment/assignment-requests/${request.id}`}
                      className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 transition hover:bg-slate-200"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState message="No assignment requests available yet." />
            </div>
          )}
        </SectionCard>

        <DashboardActionCard
          href="/dashboard/jobseeker/totj-employment/timekeeping"
          title="Timekeeping"
          description="View active assignments and clock in/out activity."
          cta="Open"
        >
          <p className="text-sm text-slate-600">
            {assignment ? `Current assignment status: ${assignment.status || "active"}` : "No active assignment found yet."}
          </p>
        </DashboardActionCard>

        <div className="xl:col-span-2">
          <TimekeepingHomeCard />
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

  if (session.user?.role !== "jobseeker") {
    const destination = session.user?.role === "employer" ? "/dashboard/employer" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  // Phase II test-only access point: do not widen without an intentional rollout decision.
  if (!isPhaseTwoJobseeker(session)) {
    return {
      redirect: {
        destination: "/dashboard/jobseeker",
        permanent: false,
      },
    };
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      jobseekerprofile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          trade: true,
          phone: true,
          updatedAt: true,
        },
      },
    },
  });

  const profile = userRecord?.jobseekerprofile;

  if (!profile?.id) {
    return {
      props: {
        snapshot: null,
        verification: null,
        documents: [],
        signatures: [],
        requests: [],
        assignment: null,
      },
    };
  }

  const [verificationRows, documentRows, signatureRows, requestRows, assignmentRows] = await Promise.all([
    safeRaw(Prisma.sql`
      SELECT *
      FROM public.employment_verification
      WHERE jobseeker_id = ${profile.id}::uuid
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1
    `),
    safeRaw(Prisma.sql`
      SELECT *
      FROM public.employment_documents
      WHERE jobseeker_id = ${profile.id}::uuid
      ORDER BY created_at DESC NULLS LAST
      LIMIT 5
    `),
    safeRaw(Prisma.sql`
      SELECT *
      FROM public.employment_form_signatures
      WHERE jobseeker_id = ${profile.id}::uuid
      ORDER BY signed_at DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 5
    `),
    safeRaw(Prisma.sql`
      SELECT
        ar.id,
        ar.employer_id,
        ar.status,
        ar.sent_at,
        ar.responded_at,
        ep."companyName" AS employer_company_name
      FROM public.assignment_requests ar
      LEFT JOIN public.employerprofile ep ON ep.id = ar.employer_id
      WHERE ar.jobseeker_id = ${profile.id}::uuid
      ORDER BY ar.sent_at DESC NULLS LAST, ar.created_at DESC NULLS LAST
      LIMIT 5
    `),
    safeRaw(Prisma.sql`
      SELECT *
      FROM public.job_order_assignments
      WHERE jobseeker_id = ${profile.id}::uuid
      ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST
      LIMIT 1
    `),
  ]);

  return {
    props: {
      snapshot: {
        firstName: profile.firstName || null,
        lastName: profile.lastName || null,
        email: userRecord?.email || profile.email || null,
        trade: profile.trade || null,
        phone: profile.phone || null,
        updatedAt: profile.updatedAt ? profile.updatedAt.toISOString() : null,
      },
      verification: verificationRows[0] || null,
      documents: documentRows,
      signatures: signatureRows,
      requests: requestRows,
      assignment: assignmentRows[0] || null,
    },
  };
}
