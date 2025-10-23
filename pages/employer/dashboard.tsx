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

export default function EmployerDashboard() {
  return null;
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
        destination: "/employer/login",
        permanent: false,
      },
    };
  }

  if (session.user?.role !== "employer") {
    const destination =
      session.user?.role === "jobseeker"
        ? "/jobseeker/dashboard"
        : "/";
    return {
      redirect: {
        destination,
        permanent: false,
      },
    };
  }

  return {
    redirect: {
      destination: "/dashboard/employer",
      permanent: false,
    },
  };
}
