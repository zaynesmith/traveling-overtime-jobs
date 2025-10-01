import { useMemo, useState } from "react";
import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/nextjs";
import {
  ForbiddenOrSwitchRole,
  LoadingCard,
} from "../../components/RoleGateFeedback";
import { RoleSelectCard } from "../../components/RoleSelectCard";
import { useRequireRole } from "../../lib/useRequireRole";
import { useRequireProfileCompletion } from "../../lib/useRequireProfileCompletion";
import { resumeDatabase } from "../../lib/demoEmployerData";

export default function TalentSearch() {
  const [query, setQuery] = useState("");
  const [trade, setTrade] = useState("all");
  const { user } = useUser();
  const { status, error, assignRole, isAssigningRole } = useRequireRole(
    "employer"
  );
  const { status: profileStatus } = useRequireProfileCompletion(
    status === "ready" ? "employer" : null
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return resumeDatabase.filter((candidate) => {
      if (trade !== "all" && candidate.trade !== trade) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        candidate.name,
        candidate.trade,
        candidate.location,
        candidate.skills.join(" "),
        candidate.availability,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [query, trade]);

  const uniqueTrades = useMemo(() => {
    const trades = new Set(resumeDatabase.map((candidate) => candidate.trade));
    return ["all", ...Array.from(trades)];
  }, []);

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/talent" />
      </SignedOut>

      <SignedIn>
        {status === "checking" ||
        profileStatus === "loading" ||
        profileStatus === "incomplete" ? (
          <LoadingCard role="employer" />
        ) : status === "needs-role" ? (
          <RoleSelectCard onChoose={assignRole} />
        ) : status === "forbidden" ? (
          <ForbiddenOrSwitchRole
            expectedRole="employer"
            currentRole={user?.publicMetadata?.role}
            onChoose={assignRole}
            isAssigning={isAssigningRole}
            error={error}
          />
        ) : status === "ready" ? (
          <main className="container" style={{ padding: "40px 24px" }}>
            <div className="max960" style={{ display: "grid", gap: 24 }}>
              <header style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <h1 style={{ margin: 0 }}>Resume database</h1>
                  <p style={{ margin: "6px 0 0", color: "#475569" }}>
                    Search the latest traveling tradespeople and reach out when you find a match.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Link href="/employer" className="pill-light">
                    ← Back to dashboard
                  </Link>
                  <Link href="/employer/listings" className="pill-light">
                    Review my postings
                  </Link>
                </div>
              </header>

              <section className="card" style={{ padding: 24, display: "grid", gap: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                    Search by name, skill, or location
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. PLC, foreman, Houston"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <label style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>
                    Filter by trade
                  </label>
                  <select
                    className="input"
                    value={trade}
                    onChange={(event) => setTrade(event.target.value)}
                  >
                    {uniqueTrades.map((option) => (
                      <option key={option} value={option}>
                        {option === "all" ? "All trades" : option}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              <section style={{ display: "grid", gap: 16 }}>
                <h2 style={{ margin: 0 }}>Matching candidates ({results.length})</h2>

                {results.length === 0 ? (
                  <div className="card" style={{ padding: 24 }}>
                    <p style={{ margin: 0, color: "#64748b" }}>
                      No resumes match that search yet. Adjust your filters or check back soon.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {results.map((candidate) => (
                      <CandidateCard key={candidate.id} candidate={candidate} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          </main>
        ) : (
          <LoadingCard role="employer" />
        )}
      </SignedIn>
    </>
  );
}

function CandidateCard({ candidate }) {
  return (
    <article
      className="card"
      style={{
        border: "1px solid rgba(15, 23, 42, 0.08)",
        borderRadius: 12,
        padding: "16px 20px",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>{candidate.name}</h3>
          <p style={{ margin: 0, color: "#475569" }}>{candidate.trade}</p>
        </div>
        <span
          style={{
            alignSelf: "flex-start",
            background: "#ecfdf5",
            color: "#047857",
            borderRadius: 9999,
            fontSize: 12,
            fontWeight: 600,
            padding: "6px 12px",
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          {candidate.availability}
        </span>
      </div>
      <p style={{ margin: 0, color: "#334155" }}>
        {candidate.location} • {candidate.yearsExperience} years experience
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {candidate.skills.map((skill) => (
          <span
            key={skill}
            style={{
              background: "#e2e8f0",
              color: "#0f172a",
              borderRadius: 9999,
              padding: "4px 10px",
              fontSize: 12,
            }}
          >
            {skill}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
        <button className="btn" style={{ padding: "6px 14px", fontSize: 14 }}>Request resume</button>
        <button className="pill-light" style={{ padding: "6px 14px", fontSize: 14 }}>
          Send message
        </button>
      </div>
    </article>
  );
}
