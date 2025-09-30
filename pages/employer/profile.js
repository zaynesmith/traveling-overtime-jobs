import Link from "next/link";
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { RoleGateDenied, RoleGateLoading } from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";

export default function EmployerProfile() {
  const router = useRouter();
  const onboarding = router.query?.onboarding === "1";
  const { user, isLoaded, isSignedIn } = useUser();
  const { status, canView, error } = useRequireRole("employer");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    if (pm.companyName) setCompanyName(String(pm.companyName));
    if (pm.companyContactEmail) setContactEmail(String(pm.companyContactEmail));
    if (pm.companyWebsite) setWebsite(String(pm.companyWebsite));
    if (pm.companyPhone) setPhone(String(pm.companyPhone));
  }, [isLoaded, user]);

  if (!isLoaded) {
    return <RoleGateLoading role="employer" />;
  }

  if (!isSignedIn) {
    return (
      <SignedOut>
        <RedirectToSignIn redirectUrl="/employer/profile" />
      </SignedOut>
    );
  }

  if (!canView) {
    if (status === "checking") {
      return <RoleGateLoading role="employer" />;
    }

    return (
      <RoleGateDenied
        expectedRole="employer"
        status={status}
        error={error}
        currentRole={user?.publicMetadata?.role}
      />
    );
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!user) return;

    const trimmedCompany = companyName.trim();
    const trimmedEmail = contactEmail.trim();
    const trimmedWebsite = website.trim();
    const trimmedPhone = phone.trim();

    setFormError("");

    if (!trimmedCompany || !trimmedEmail || !trimmedWebsite || !trimmedPhone) {
      setFormError("Please complete all required company details.");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          companyName: trimmedCompany,
          companyContactEmail: trimmedEmail,
          companyWebsite: trimmedWebsite,
          companyPhone: trimmedPhone,
          hasCompletedEmployerProfile: true,
        },
      });

      setSaved(true);
      if (onboarding) {
        router.replace("/employer/profile", undefined, { shallow: true });
      }
    } catch (err) {
      console.error(err);
      alert("Could not save your company profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SignedIn>
      {status === "checking" ? (
        <RoleGateLoading role="employer" />
      ) : (
        <main className="container">
          <header
            className="max960"
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h1 style={{ margin: 0 }}>Employer Profile</h1>
            <Link href="/employer" className="pill-light" style={{ fontSize: 14 }}>
              ← Back to dashboard
            </Link>
          </header>

          <section className="card max960">
            <h2 style={{ marginTop: 0 }}>Company Profile</h2>
            <p style={{ color: "#555" }}>These values prefill the Post Job form.</p>

            <form onSubmit={handleSave} style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {onboarding && (
                <div
                  style={{
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    color: "#1d4ed8",
                    padding: "12px 16px",
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                >
                  Complete your company details to unlock the employer workspace.
                </div>
              )}

              {formError && (
                <div
                  role="alert"
                  style={{
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                >
                  {formError}
                </div>
              )}

              <Field label="Company Name*">
                <input
                  className="input"
                  value={companyName}
                  onChange={(event) => setCompanyName(event.target.value)}
                  placeholder="ACME Industrial"
                  required
                />
              </Field>
              <Field label="Contact Email*">
                <input
                  className="input"
                  type="email"
                  value={contactEmail}
                  onChange={(event) => setContactEmail(event.target.value)}
                  placeholder="jobs@acme.com"
                  required
                />
              </Field>
              <Field label="Company Website*">
                <input
                  className="input"
                  type="url"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="https://acmeindustrial.com"
                  required
                />
              </Field>
              <Field label="Phone*">
                <input
                  className="input"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="(555) 123-4567"
                  required
                />
              </Field>

              <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                <button className="btn" disabled={saving}>
                  {saving ? "Saving…" : "Save Company Profile"}
                </button>
                <Link href="/employer" className="pill-light">
                  Back to Employer Area
                </Link>
              </div>

              {saved && (
                <div
                  style={{
                    marginTop: 10,
                    background: "#f6fff6",
                    border: "1px solid #bfe6bf",
                    color: "#225c22",
                    padding: "10px 12px",
                    borderRadius: 10,
                    fontSize: 14,
                  }}
                >
                  ✅ Saved to your account.
                </div>
              )}
            </form>
          </section>
        </main>
      )}
    </SignedIn>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "#444" }}>{label}</label>
      {children}
    </div>
  );
}
