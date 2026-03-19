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

export default function DocumentsPage({ documents, signatures }) {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <section className="mx-auto max-w-4xl rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-900/5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">Employment Documents</h1>
          <Link href="/dashboard/jobseeker/totj-employment" className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            Back
          </Link>
        </div>

        {documents.length ? (
          <ul className="mt-6 space-y-3">
            {documents.map((document) => (
              <li key={document.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">{document.document_type || document.doc_type || "Document"}</p>
                <p>Status: {document.status || "—"}</p>
                <p>Uploaded: {formatDate(document.created_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 text-sm text-slate-600">No employment documents uploaded yet.</p>
        )}

        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-900">Form Signatures</p>
          <p className="mt-1">Signed forms: {signatures.length}</p>
          <p>Most recent signature: {formatDate(signatures[0]?.signed_at || signatures[0]?.created_at)}</p>
        </div>
      </section>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) return { redirect: { destination: "/jobseeker/login", permanent: false } };
  if (!isPhaseTwoJobseeker(session)) return { redirect: { destination: "/dashboard/jobseeker", permanent: false } };

  const profile = await prisma.jobseekerProfile.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!profile?.id) return { props: { documents: [], signatures: [] } };

  const [documents, signatures] = await Promise.all([
    prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public.employment_documents
        WHERE jobseeker_id = ${profile.id}::uuid
        ORDER BY created_at DESC NULLS LAST
        LIMIT 20
      `,
    ),
    prisma.$queryRaw(
      Prisma.sql`
        SELECT *
        FROM public.employment_form_signatures
        WHERE jobseeker_id = ${profile.id}::uuid
        ORDER BY signed_at DESC NULLS LAST, created_at DESC NULLS LAST
        LIMIT 20
      `,
    ),
  ]);

  return {
    props: {
      documents: Array.isArray(documents) ? documents : [],
      signatures: Array.isArray(signatures) ? signatures : [],
    },
  };
}
