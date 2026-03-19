import { useState } from "react";
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

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-slate-900 whitespace-pre-wrap">{value || "—"}</dd>
    </div>
  );
}

export default function AssignmentRequestDetailPage({ request, notFound }) {
  const [acting, setActing] = useState("");
  const [status, setStatus] = useState(request?.status || "");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  if (notFound || !request) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
          <h1 className="text-xl font-bold text-slate-900">Assignment request not found</h1>
          <Link href="/dashboard/jobseeker/totj-employment/assignment-requests" className="mt-4 inline-flex text-sm font-semibold text-sky-700">
            Back to assignment requests
          </Link>
        </div>
      </main>
    );
  }

  async function handleDecision(decision) {
    setActing(decision);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/jobseeker/assignment-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: request.id, decision }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update request");
      }

      const updated = payload?.request?.status || (decision === "accept" ? "accepted" : "rejected");
      setStatus(updated);
      setMessage(`Request ${updated}.`);
    } catch (err) {
      setError(err.message || "Failed to update request");
    } finally {
      setActing("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <section className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 lg:px-8">
        <article className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-slate-900/5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">TOTJ Employment</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Assignment Request Details</h1>
            </div>
            <Link
              href="/dashboard/jobseeker/totj-employment/assignment-requests"
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-slate-700"
            >
              Back
            </Link>
          </div>

          <div className="mt-4 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Status: {status || "pending"}
          </div>

          {message ? <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <Field label="Project" value={request.project_name} />
            <Field label="Job number" value={request.job_name || request.job_order_id} />
            <Field label="Site address" value={request.site_address} />
            <Field label="Message (optional)" value={request.message} />
            <Field label="Hourly pay" value={request.hourly_pay} />
            <Field label="Per diem" value={request.per_diem} />
            <Field label="Sent at" value={formatDate(request.sent_at)} />
            <Field label="Responded at" value={formatDate(request.responded_at)} />
          </dl>

          <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
              Orientation / welcome PDFs (optional, up to 5, 25MB each)
            </h2>
            {request.documents?.length ? (
              <ul className="mt-3 space-y-2">
                {request.documents.map((document) => (
                  <li key={document.id} className="rounded-xl bg-white p-3 text-sm text-slate-700 ring-1 ring-slate-200">
                    <p className="font-semibold text-slate-900">{document.file_name || "Document"}</p>
                    <p>Type: {document.mime_type || "application/pdf"}</p>
                    <p>Uploaded: {formatDate(document.created_at)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-600">No orientation/welcome PDFs were attached.</p>
            )}
          </section>

          {(status || "").toLowerCase() === "pending" ? (
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleDecision("accept")}
                disabled={Boolean(acting)}
                className="rounded-full bg-emerald-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {acting === "accept" ? "Working..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => handleDecision("decline")}
                disabled={Boolean(acting)}
                className="rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50"
              >
                {acting === "decline" ? "Working..." : "Decline"}
              </button>
            </div>
          ) : null}
        </article>
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

  const requestId = String(context.params?.requestId || "");
  const profile = await prisma.jobseekerProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!profile?.id) {
    return { props: { request: null, notFound: true } };
  }

  const requestRows = await prisma.$queryRaw(
    Prisma.sql`
      SELECT
        ar.id,
        ar.job_order_id,
        ar.hourly_pay,
        ar.per_diem,
        ar.message,
        ar.status,
        ar.sent_at,
        ar.responded_at,
        p.name AS project_name,
        jo.job_name,
        CONCAT_WS(', ', NULLIF(jo.address1, ''), NULLIF(jo.city, ''), NULLIF(jo.state::text, ''), NULLIF(jo.zip, '')) AS site_address
      FROM public.assignment_requests ar
      INNER JOIN public.job_orders jo ON jo.id = ar.job_order_id
      LEFT JOIN public.projects p ON p.id = jo.project_id
      WHERE ar.id = ${requestId}::uuid
        AND ar.jobseeker_id = ${profile.id}::uuid
      LIMIT 1
    `,
  );

  const request = requestRows?.[0] || null;
  if (!request) {
    return { props: { request: null, notFound: true } };
  }

  const docs = await prisma.$queryRaw(
    Prisma.sql`
      SELECT id, file_name, mime_type, storage_path, created_at
      FROM public.assignment_request_documents
      WHERE request_id = ${request.id}::uuid
      ORDER BY created_at DESC
      LIMIT 5
    `,
  );

  return {
    props: {
      request: {
        ...request,
        documents: Array.isArray(docs) ? docs : [],
      },
      notFound: false,
    },
  };
}
