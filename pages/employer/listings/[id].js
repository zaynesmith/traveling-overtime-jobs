import { SignedIn, SignedOut, RedirectToSignIn, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/router";

const DEMO = {
  "acme-001": { title:"Journeyman Electrician", location:"Houston, TX", pay:"$38/hr", perDiem:"$100/day", status:"Open", description:"Industrial shutdown work. Pulling cable, terminations, MCC. TWIC a plus. PPE required.", applicants:12, postedAt:"2025-09-30" },
  "acme-002": { title:"Electrical Foreman", location:"Corpus Christi, TX", pay:"$45/hr", perDiem:"$100/day", status:"Open", description:"Lead crew of 6–10. Conduit, prints, ordering materials. OSHA 30 preferred.", applicants:4, postedAt:"2025-10-02" },
  "acme-003": { title:"Instrument Tech", location:"Baton Rouge, LA", pay:"$42/hr", perDiem:"$120/day", status:"Closed", description:"Troubleshoot loops, calibrations, pneumatics. Refinery experience preferred.", applicants:23, postedAt:"2025-08-20" }
};

export default function ListingDetail() {
  const { query } = useRouter();
  const job = DEMO[String(query.id)] || null;

  return (
    <>
      <SignedOut><RedirectToSignIn redirectUrl={`/employer/listings/${query.id || ""}`} /></SignedOut>
      <SignedIn>
        <main className="container">
          <header className="max960" style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h1 style={{ margin: 0 }}>Listing Details</h1>
            <UserButton afterSignOutUrl="/" />
          </header>

          {!job ? (
            <section className="card max960">Not found.</section>
          ) : (
            <section className="card max960">
              <h2 style={{ marginTop:0 }}>{job.title}</h2>
              <p style={{ margin:"8px 0" }}><strong>Location:</strong> {job.location}</p>
              <p style={{ margin:"8px 0" }}><strong>Pay:</strong> {job.pay} &nbsp; • &nbsp; <strong>Per Diem:</strong> {job.perDiem}</p>
              <p style={{ margin:"8px 0" }}><strong>Status:</strong> {job.status} &nbsp; • &nbsp; <strong>Posted:</strong> {job.postedAt}</p>
              <p style={{ marginTop:16 }}>{job.description}</p>
              <div style={{ display:"flex", gap:12, marginTop:16 }}>
                <a href="/employer/listings" className="pill-light">← Back to Listings</a>
              </div>
            </section>
          )}
        </main>
      </SignedIn>
    </>
  );
}