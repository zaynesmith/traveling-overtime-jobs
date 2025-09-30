import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type OnboardSearchParams = {
  intent?: string;
};

type Role = "employer" | "jobseeker";

export default async function Onboard({ searchParams }: { searchParams: OnboardSearchParams }) {
  const user = await currentUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const intent = searchParams.intent;
  const existingRole = user.publicMetadata?.role as Role | undefined;

  if (!existingRole && (intent === "employer" || intent === "jobseeker")) {
    await clerkClient.users.updateUser(user.id, {
      publicMetadata: { role: intent },
      privateMetadata: { roleLocked: true },
    });
  }

  const role = (existingRole ?? intent) as Role | undefined;

  if (role === "employer") {
    return redirect("/onboard/employer");
  }

  return redirect("/onboard/jobseeker");
}
