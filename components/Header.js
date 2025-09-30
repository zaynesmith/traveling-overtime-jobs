// components/Header.js
import Link from "next/link";
import { SignedIn, UserButton, useUser } from "@clerk/nextjs";
import { getRoleHomeHref } from "../lib/getRoleHomeHref";

const jobseekerNav = [
  { href: "/jobseeker", label: "Jobseeker Dashboard" },
  { href: "/jobseeker/search", label: "Search Jobs" },
];

const employerNav = [
  { href: "/employer", label: "Employer Dashboard" },
  { href: "/employer/post", label: "Post a Job" },
];

export default function Header() {
  const { isSignedIn, user } = useUser();
  const role = user?.publicMetadata?.role;

  let navItems = [];
  if (isSignedIn && role === "jobseeker") navItems = jobseekerNav;
  else if (isSignedIn && role === "employer") navItems = employerNav;

  const brandHref = getRoleHomeHref(role);

  return (
    <header style={wrap}>
      <Link href={brandHref} style={brand}>
        Traveling Overtime Jobs
      </Link>

      <nav style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {navItems.map((item) => (
          <a key={item.href} href={item.href} style={navLink}>
            {item.label}
          </a>
        ))}

        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </nav>
    </header>
  );
}

const wrap = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 20px", borderBottom:"1px solid #eee", position:"sticky", top:0, background:"#fff", zIndex:10 };
const brand = { fontWeight:800, textDecoration:"none", color:"#111" };
const navLink = { textDecoration:"none", color:"#111", padding:"8px 10px", borderRadius:8, border:"1px solid #eee" };
