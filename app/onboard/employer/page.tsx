import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function EmployerOnboard() {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  if (user.publicMetadata?.role !== "employer") {
    return redirect("/unauthorized");
  }

  return <div style={{ padding: 32 }}>Employer onboarding form goes here</div>;
}
