import { getServerSession } from "next-auth/next";
import authOptions from "../../lib/authOptions";

export default function EmployerDashboard() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Employer dashboard</h1>
      <p className="text-gray-600">
        You&apos;re set up to start drafting listings. Build out your posting workflow and invite your team soon.
      </p>
    </main>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
}
