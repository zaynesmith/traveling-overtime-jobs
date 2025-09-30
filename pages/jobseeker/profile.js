import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
  useUser,
  UserButton,
} from "@clerk/nextjs";
import { RoleGateDenied, RoleGateLoading } from "../../components/RoleGateFeedback";
import { useRequireRole } from "../../lib/useRequireRole";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5 MB

export default function JobseekerProfile() {
  const router = useRouter();
  const onboarding = router.query?.onboarding === "1";
  const { user, isLoaded } = useUser();
  const { status, canView, error } = useRequireRole("jobseeker");
  const [fullName, setFullName] = useState("");
  const [trade, setTrade] = useState("");
  const [zip, setZip] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [formError, setFormError] = useState("");
  const [processingFile, setProcessingFile] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    const pm = user.publicMetadata || {};
    const nameFromClerk =
      user.fullName?.trim() ||
      [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    if (nameFromClerk) setFullName(nameFromClerk);
    if (pm.trade) setTrade(String(pm.trade));
    if (pm.zip) setZip(String(pm.zip));
    const storedResume = user.privateMetadata?.resumeFile;
    if (storedResume && typeof storedResume === "object" && storedResume.dataUrl) {
      setResumeFile({
        name: String(storedResume.name || "resume"),
        size: Number(storedResume.size) || 0,
        type: String(storedResume.type || ""),
        dataUrl: String(storedResume.dataUrl),
        uploadedAt:
          typeof storedResume.uploadedAt === "string"
            ? storedResume.uploadedAt
            : new Date().toISOString(),
      });
    }
  }, [isLoaded, user]);

  const readyForForm = canView && Boolean(user);

  function handleResumeSelection(file) {
    if (!file) return;
    setResumeError("");
    if (file.size > MAX_RESUME_SIZE) {
      setResumeError("Upload a PDF or DOC smaller than 5 MB.");
      return;
    }

    const reader = new FileReader();
    setProcessingFile(true);
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setResumeError("We couldn't read that file. Try again.");
        setProcessingFile(false);
        return;
      }
      setResumeFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
      setProcessingFile(false);
    };
    reader.onerror = () => {
      setResumeError("We couldn't read that file. Try another resume.");
      setProcessingFile(false);
    };
    reader.readAsDataURL(file);
  }

  function clearResume() {
    setResumeFile(null);
    setResumeError("");
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!user) return;

    const trimmedName = fullName.trim();
    const trimmedTrade = trade.trim();
    const trimmedZip = zip.trim();

    setFormError("");
    setResumeError("");

    if (processingFile) {
      setResumeError("Please wait for the resume upload to finish before saving.");
      return;
    }

    if (!trimmedName || !trimmedTrade || !trimmedZip) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (!resumeFile || !resumeFile.dataUrl) {
      setResumeError("Upload your resume before saving.");
      return;
    }

    try {
      setSaving(true);
      setSaved(false);

      const resumePayload = {
        name: resumeFile.name,
        size: resumeFile.size,
        type: resumeFile.type,
        dataUrl: resumeFile.dataUrl,
        uploadedAt: resumeFile.uploadedAt || new Date().toISOString(),
      };

      await user.update({
        publicMetadata: {
          ...(user.publicMetadata || {}),
          trade: trimmedTrade,
          zip: trimmedZip,
          hasCompletedJobseekerProfile: true,
        },
        privateMetadata: {
          ...(user.privateMetadata || {}),
          resumeFile: resumePayload,
        },
      });

      const currentFullName = (user.fullName || "").trim();
      if (trimmedName && trimmedName !== currentFullName) {
        const [firstName, ...rest] = trimmedName.split(/\s+/);
        await user.update({
          firstName: firstName || user.firstName || "",
          lastName: rest.join(" ") || user.lastName || "",
        });
      }

      setResumeFile(resumePayload);
      setSaved(true);
      if (onboarding) {
        router.replace("/jobseeker/profile", undefined, { shallow: true });
      }
    } catch (err) {
      console.error(err);
      alert("Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SignedOut>
        <RedirectToSignIn redirectUrl="/jobseeker/profile" />
      </SignedOut>

      <SignedIn>
        {status === "checking" ? (
          <RoleGateLoading role="jobseeker" />
        ) : readyForForm ? (
          <main className="container">
            <header
              className="max960"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h1 style={{ margin: 0 }}>My Profile</h1>
              <UserButton afterSignOutUrl="/" />
            </header>

            <section className="card max960">
              <form onSubmit={handleSave} style={{ display: "grid", gap: 16 }}>
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
                    Complete your jobseeker profile to unlock the jobseeker workspace.
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

                <Field label="Full Name*">
                  <input
                    className="input"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Jane Electrician"
                    required
                  />
                </Field>
                <Field label="Trade*">
                  <input
                    className="input"
                    value={trade}
                    onChange={(event) => setTrade(event.target.value)}
                    placeholder="Electrician / Millwright / Welder…"
                    required
                  />
                </Field>
                <Field label="ZIP*">
                  <input
                    className="input"
                    value={zip}
                    onChange={(event) => setZip(event.target.value)}
                    placeholder="77001"
                    required
                  />
                </Field>

                <ResumeUploadField
                  value={resumeFile}
                  onSelect={handleResumeSelection}
                  onRemove={clearResume}
                  error={resumeError}
                  processing={processingFile}
                />

                <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                  <button className="btn" disabled={saving || processingFile}>
                    {saving ? "Saving…" : "Save Profile"}
                  </button>
                  <a href="/jobseeker" className="pill-light">
                    Back to Jobseeker Area
                  </a>
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
        ) : canView ? (
          <RoleGateLoading role="jobseeker" />
        ) : (
          <RoleGateDenied
            expectedRole="jobseeker"
            status={status}
            error={error}
            currentRole={user?.publicMetadata?.role}
          />
        )}
      </SignedIn>
    </>
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

function ResumeUploadField({ value, onSelect, onRemove, error, processing }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const borderColor = error
    ? "#f87171"
    : isDragging
    ? "#2563eb"
    : "#cbd5f5";

  function handleBrowseClick() {
    if (processing) return;
    inputRef.current?.click();
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    if (processing) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      onSelect(file);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    if (!processing) {
      setIsDragging(true);
    }
  }

  function handleDragLeave(event) {
    if (event.currentTarget.contains(event.relatedTarget)) {
      return;
    }
    setIsDragging(false);
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <label style={{ fontSize: 13, color: "#444" }}>Resume*</label>
      <div
        role="button"
        tabIndex={0}
        onClick={handleBrowseClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleBrowseClick();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-busy={processing}
        style={{
          border: `2px dashed ${borderColor}`,
          borderRadius: 12,
          padding: "18px 20px",
          display: "grid",
          gap: 8,
          cursor: processing ? "not-allowed" : "pointer",
          background: processing ? "#f8fafc" : "#f9fbff",
        }}
      >
        {value ? (
          <div style={{ display: "grid", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <div>
                <strong>{value.name}</strong>
                <div style={{ fontSize: 13, color: "#475569" }}>
                  {formatFileSize(value.size)}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {value.dataUrl && (
                  <a
                    className="pill-light"
                    href={value.dataUrl}
                    download={value.name}
                    onClick={(event) => event.stopPropagation()}
                  >
                    Download
                  </a>
                )}
                <button
                  type="button"
                  className="pill-light"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove();
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#475569" }}>
              Drop a new file or click to replace your resume.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            <strong style={{ color: "#0f172a" }}>Drag & drop your resume</strong>
            <span style={{ fontSize: 13, color: "#475569" }}>
              PDF or DOC files up to 5 MB. Click to browse.
            </span>
          </div>
        )}
        {processing && (
          <span style={{ fontSize: 12, color: "#475569" }}>Uploading…</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.rtf"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            onSelect(file);
          }
          event.target.value = "";
        }}
        disabled={processing}
      />
      {error && (
        <span style={{ color: "#b91c1c", fontSize: 13 }}>{error}</span>
      )}
    </div>
  );
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "";
  }
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${bytes} B`;
}
