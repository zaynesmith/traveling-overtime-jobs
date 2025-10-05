import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const dashboardHref = role === "employer" ? "/employer/dashboard" : "/jobseeker/dashboard";

  return (
    <header style={wrap}>
      <Link href="/" style={brand}>
        Traveling Overtime Jobs
      </Link>
      {session ? (
        <nav style={nav}>
          <Link href={dashboardHref} style={navLink}>
            Dashboard
          </Link>
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} style={buttonLink}>
            Sign out
          </button>
        </nav>
      ) : null}
    </header>
  );
}

const wrap = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "14px 20px",
  borderBottom: "1px solid #eee",
  position: "sticky",
  top: 0,
  background: "#fff",
  zIndex: 10,
};

const brand = { fontWeight: 800, textDecoration: "none", color: "#111" };
const nav = { display: "flex", gap: 10, alignItems: "center" };
const navLink = {
  textDecoration: "none",
  color: "#111",
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #eee",
};
const buttonLink = {
  ...navLink,
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};
