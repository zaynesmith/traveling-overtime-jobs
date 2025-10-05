import type { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import authOptions from "../../lib/authOptions";

export default function EmployerDashboard() {
  return (
    <main className="dashboard-page">
      <h1 className="dashboard-heading">Welcome Employer, manage your company and jobs here.</h1>
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/employer/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "employer") {
    const destination = session.user?.role === "jobseeker" ? "/jobseeker/dashboard" : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return { props: {} };
}
