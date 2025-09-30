import Link from "next/link";

export default function AuthEntry() {
  return (
    <div className="flex" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Link href="/sign-in?intent=employer&redirect_url=/onboard" className="btn">
        Employer Login
      </Link>
      <Link href="/sign-in?intent=jobseeker&redirect_url=/onboard" className="btn">
        Jobseeker Login
      </Link>
    </div>
  );
}
