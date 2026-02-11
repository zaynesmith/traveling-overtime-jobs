import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const dashboardHref = role === "employer" ? "/employer/dashboard" : "/jobseeker/dashboard";

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Failed to clear auth cookies before sign-out", error);
    } finally {
      await signOut({ callbackUrl: "/" });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-slate-900 transition-colors hover:text-slate-600"
        >
          Traveling Overtime Jobs
        </Link>
        {session ? (
          <nav className="flex items-center gap-3">
            <Link
              href={dashboardHref}
              className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              Sign out
            </button>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
