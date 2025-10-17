import type { GetServerSidePropsContext } from "next";
import type { Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import authOptions from "../../lib/authOptions";

type SessionWithRole = Session & {
  user?: Session["user"] & {
    id?: string | null;
    role?: string | null;
  };
};

export default function JobseekerDashboard() {
  return (
    <main className="dashboard-page">
      <h1 className="dashboard-heading">
        Welcome Jobseeker, browse and apply to jobs here.
      </h1>
    </main>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = (await getServerSession(
    context.req,
    context.res,
    authOptions
  )) as SessionWithRole | null;

  if (!session) {
    return {
      redirect: {
        destination: "/jobseeker/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "jobseeker") {
    const destination =
      session.user?.role === "employer"
        ? "/employer/dashboard"
        : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return { props: {} };
}
