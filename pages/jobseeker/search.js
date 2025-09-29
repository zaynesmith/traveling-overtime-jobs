import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { useMemo, useState } from "react";

const DEMO_JOBS = [
  { id:"j1", title:"Journeyman Electrician", company:"ACME", location:"Houston, TX", pay:"$38/hr", perDiem:"$100/day" },
  { id:"j2", title:"Welder - TIG", company:"GulfFab", location:"Lake Charles, LA", pay:"$35/hr", perDiem:"$80/day" },
  { id:"j3", title:"Millwright", company:"SteelCo", location:"Corpus Christi, TX", pay:"$34/hr", perDiem:"$90/day" }
];

export default function JobSearch() {
  const [q, setQ] = useState("");
  const results = useMemo(()=>{
    const kw = q.trim().toLowerCase();
    if (!kw) return DEMO_JOBS;
    return DEMO_JOBS.filter(j => [j.title,j.company,j.location].join(" ").toLowerCase().includes(kw));
  }, [q]);

  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl="/jobseeker/search" /></SignedOut>
      <SignedIn>
        <main className="container">
          <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h1 style={{ margin: 0 }}>Search Jobs</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          <section className="card max960" style={{ display:"grid", gap:12 }}>
            <input className="input" placeholder="Title, company, or location…" value={q} onChange={(e)=>setQ(e.target.value)} />
            {results.map(j=>(
              <div key={j.id} style={{ border:"1px solid #eee", borderRadius:10, padding:12, display:"grid", gap:6 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <strong>{j.title}</strong>
                  <a href="#" className="pill-light">Save</a>
                </div>
                <div style={{ color:"#555" }}>{j.company} • {j.location}</div>
                <div style={{ color:"#333" }}>{j.pay} • {j.perDiem}</div>
              </div>
            ))}
          </section>
        </main>
      </SignedIn>
    </>
  );
}