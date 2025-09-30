import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function JobseekerOnboard() {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  if (user.publicMetadata?.role !== "jobseeker") {
    return redirect("/unauthorized");
  }

  return <div style={{ padding: 32 }}>Jobseeker onboarding form goes here</div>;
}
