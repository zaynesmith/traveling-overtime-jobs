import { SignedIn, SignedOut, RedirectToSignIn, useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";

const DEMO_MY_LISTINGS = [
  { id:"acme-001", title:"Journeyman Electrician", company:"ACME Industrial", location:"Houston, TX", status:"Open", applicants:12, postedAt:"2025-09-30" },
  { id:"acme-002", title:"Electrical Foreman", company:"ACME Industrial", location:"Corpus Christi, TX", status:"Open", applicants:4, postedAt:"2025-10-02" },
  { id:"acme-003", title:"Instrument Tech", company:"ACME Industrial", location:"Baton Rouge, LA", status:"Closed", applicants:23, postedAt:"2025-08-20" }
];

export default function EmployerListings() {
  const { user, isLoaded } = useUser();
  const [q, setQ] = useState(""); const [status, setStatus] = useState("All");
  const [list, setList] = useState(DEMO_MY_LISTINGS);

  useEffect(()=>{ if (typeof window !== "undefined") window.scrollTo(0,0); }, []);
  const filtered = useMemo(() => {
    let out = [...list];
    const kw = q.trim().toLowerCase();
    if (kw) out = out.filter((j)=>[j.title,j.company,j.location,j.status].join(" ").toLowerCase().includes(kw));
    if (status !== "All") out = out.filter((j)=> j.status === status);
    out.sort((a,b)=> new Date(b.postedAt) - new Date(a.postedAt));
    return out;
  }, [q,status,list]);

  if (!isLoaded) return null;

  if (!user) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/listings" />
      </SignedOut>
    );
  }

  return (
    <SignedIn>
      <main className="container">
        <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <h1 style={{ margin: 0 }}>Manage Listings</h1>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <a href="/employer/post" className="pill-light">+ Post a Job</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        <section className="card max960" style={{ marginBottom:16 }}>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:12 }}>
            <input className="input" placeholder="Search title, location, status…" value={q} onChange={(e)=>setQ(e.target.value)} />
            <select className="input" value={status} onChange={(e)=>setStatus(e.target.value)}>
              <option>All</option><option>Open</option><option>Closed</option>
            </select>
          </div>
        </section>

        <section className="card max960">
          {filtered.length===0 ? (
            <div style={{ color:"#666" }}>No listings found.</div>
          ) : (
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr><th align="left">Title</th><th align="left">Location</th><th align="left">Status</th><th align="right">Applicants</th><th align="left">Posted</th><th align="left">Actions</th></tr></thead>
              <tbody>
                {filtered.map(j=>(
                  <tr key={j.id}>
                    <td>{j.title}</td><td>{j.location}</td>
                    <td><span style={{ padding:"2px 8px", borderRadius:999, background:j.status==="Open"?"#eaffea":"#f4f4f4", border:"1px solid #ddd", fontSize:12 }}>{j.status}</span></td>
                    <td align="right">{j.applicants}</td>
                    <td>{j.postedAt}</td>
                    <td>
                      <div style={{ display:"flex", gap:8 }}>
                        <a href={`/employer/listings/${j.id}`} className="pill-light">View</a>
                        <button className="btn-outline" onClick={()=>setList(prev=>prev.map(x=>x.id===j.id?{...x,status:x.status==="Open"?"Closed":"Open"}:x))}>
                          {j.status==="Open"?"Close":"Reopen"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </SignedIn>
  );
}