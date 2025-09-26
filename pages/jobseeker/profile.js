// pages/jobseeker/profile.js
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

export default function JobseekerProfile() {
  return (
    <main className="page-wrap">
      {/* If not signed in, nudge to sign in */}
      <SignedOut>
        <div className="card">
          <h1>Jobseeker Profile</h1>
          <p>You need to be signed in to view or edit your profile.</p>
          <p>
            <a className="btn" href="/sign-in">Sign in</a>{" "}
            <a className="btn secondary" href="/sign-up">Create account</a>
          </p>
        </div>
      </SignedOut>

      {/* If signed in, show the form */}
      <SignedIn>
        <ProfileForm />
      </SignedIn>

      <style jsx>{`
        .page-wrap {
          max-width: 900px;
          margin: 24px auto;
          padding: 0 16px 48px;
        }
        .card {
          background: #fff;
          border: 1px solid #eee;
          border-radius: 14px;
          padding: 20px;
        }
        h1 { margin: 0 0 10px; }
        .btn {
          display: inline-block;
          text-decoration: none;
          border: 1px solid #ddd;
          border-radius: 10px;
          padding: 8px 12px;
          font-weight: 600;
          color: #111;
          background: #fff;
        }
        .btn.secondary { background:#111; color:#fff; border-color:#111; }
        form { display: grid; gap: 12px; }
        .row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        label { font-weight: 600; font-size: 14px; }
        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 10px;
          font-size: 14px;
        }
        textarea { min-height: 110px; resize: vertical; }
        .actions { display: flex; gap: 10px; }
        .muted { color: #666; font-size: 14px; }
        @media (max-width: 640px) {
          .row { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}

function ProfileForm() {
  const { user } = useUser();

  // Prefill from Clerk where it makes sense
  const email = user?.primaryEmailAddress?.emailAddress || "";
  const nameGuess =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    "";

  // NOTE: This form is just a placeholder (no saving yet).
  // Next steps will wire it to an API route & database.
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(
      "Profile saving will be added in the next step. For now this confirms navigation works."
    );
  };

  return (
    <div className="card">
      <h1>Jobseeker Profile</h1>
      <p className="muted">
        Signed in as <strong>{email || "your email"}</strong>
      </p>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div>
            <label>Full name</label>
            <input name="fullName" defaultValue={nameGuess} />
          </div>
          <div>
            <label>Phone</label>
            <input name="phone" placeholder="(555) 555-5555" />
          </div>
        </div>

        <div className="row">
          <div>
            <label>Primary Skill</label>
            <select name="primarySkill" defaultValue="">
              <option value="" disabled>
                Select one…
              </option>
              <option>Electrician</option>
              <option>HVAC</option>
              <option>Plumber</option>
              <option>Welder</option>
              <option>General Labor</option>
              <option>Forklift / Warehouse</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label>Years of Experience</label>
            <select name="experience" defaultValue="">
              <option value="" disabled>
                Select…
              </option>
              <option>0–1</option>
              <option>2–3</option>
              <option>4–6</option>
              <option>7–10</option>
              <option>10+</option>
            </select>
          </div>
        </div>

        <div className="row">
          <div>
            <label>Willing to Travel?</label>
            <select name="travel" defaultValue="Yes">
              <option>Yes</option>
              <option>No</option>
              <option>Maybe</option>
            </select>
          </div>
          <div>
            <label>Preferred Pay Type</label>
            <select name="payType" defaultValue="Hourly">
              <option>Hourly</option>
              <option>Salary</option>
              <option>1099</option>
            </select>
          </div>
        </div>

        <div>
          <label>Summary / Bio</label>
          <textarea
            name="bio"
            placeholder="2–4 sentences about your skills, certifications, and where you can travel."
          />
        </div>

        <div className="actions">
          <button type="submit" className="btn">Save (placeholder)</button>
          <a href="/dashboard" className="btn secondary">Back to Dashboard</a>
        </div>
      </form>
    </div>
  );
}
