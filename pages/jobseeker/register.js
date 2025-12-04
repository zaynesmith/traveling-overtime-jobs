import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import StateSelect from "@/components/forms/StateSelect";
import { US_STATES, normalizeStateCode } from "@/lib/constants/states";
import { formatZipSuggestionLocation, formatZipSuggestionMessage } from "@/lib/utils/zipMessages";
import { TRADES } from "@/lib/trades";
import TurnstileWidget from "@/components/TurnstileWidget";

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  mobilePhone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zipCode: "",
  trade: "",
  hasJourneymanLicense: "no",
  licensedStates: [],
};

function normalizeLicensedStates(value) {
  if (Array.isArray(value)) {
    return value
      .map((state) => (typeof state === "string" ? state.trim() : ""))
      .map((state) => (state ? normalizeStateCode(state) || state : ""))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((state) => state.trim())
      .map((state) => (state ? normalizeStateCode(state) || state : ""))
      .filter(Boolean);
  }

  return [];
}

export default function JobseekerRegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setFormState] = useState(() => ({
    ...initialForm,
    licensedStates: normalizeLicensedStates(initialForm.licensedStates),
  }));
  const turnstileRef = useRef(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [zipFeedback, setZipFeedback] = useState(null);

  const updateForm = (updater) => {
    setFormState((previous) => {
      const nextState = typeof updater === "function" ? updater(previous) : updater;
      return {
        ...nextState,
        licensedStates: normalizeLicensedStates(nextState.licensedStates),
      };
    });
  };

  const applyZipSuggestion = (suggestion) => {
    if (!suggestion?.zip) return;
    updateForm((prev) => ({ ...prev, zipCode: suggestion.zip }));
    setZipFeedback(null);
  };

  useEffect(() => {
    if (!session?.user?.role) return;
    if (session.user.role === "jobseeker") {
      router.replace("/jobseeker/dashboard");
    } else {
      router.replace("/employer/dashboard");
    }
  }, [router, session]);

  const updateField = (field) => (event) => {
    const { value } = event.target;
    if (field === "zipCode" || field === "city" || field === "state") {
      setZipFeedback(null);
    }
    updateForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateJourneymanLicense = (event) => {
    const value = event.target.value;
    updateForm((prev) => ({
      ...prev,
      hasJourneymanLicense: value,
      licensedStates: value === "yes" ? prev.licensedStates : [],
    }));
  };

  const updateLicensedStates = (event) => {
    const selected = Array.from(event.target.selectedOptions || [], (option) => option.value);
    updateForm((prev) => ({ ...prev, licensedStates: selected }));
  };

  const handleResumeChange = (event) => {
    const file = event.target.files?.[0] || null;
    setResumeFile(file);
    setResumeName(file ? file.name : "");
  };

  const readFileAsDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setZipFeedback(null);

    try {
      const turnstileToken = await turnstileRef.current?.execute();
      if (!turnstileToken) {
        throw new Error("Unable to verify you’re human. Please try again.");
      }

      let resumePayload = null;
      if (resumeFile) {
        try {
          const base64 = await readFileAsDataUrl(resumeFile);
          resumePayload = {
            base64,
            fileName: resumeFile.name,
            fileType: resumeFile.type || "application/octet-stream",
          };
        } catch (fileError) {
          console.error(fileError);
          throw new Error("Unable to read resume file. Please try again.");
        }
      }

      const hasJourneymanLicense = form.hasJourneymanLicense === "yes";
      const licensedStates = hasJourneymanLicense ? normalizeLicensedStates(form.licensedStates) : [];

      if (hasJourneymanLicense && licensedStates.length === 0) {
        throw new Error("Select at least one state for your journeyman license.");
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "jobseeker",
          email: form.email,
          password: form.password,
          mobilePhone: form.mobilePhone,
          firstName: form.firstName,
          lastName: form.lastName,
          address1: form.address1,
          address2: form.address2,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          trade: form.trade,
          hasJourneymanLicense,
          licensedStates,
          resume: resumePayload,
          turnstileToken,
        }),
      });

      let data = null;
      try {
        data = await response.json();
      } catch (parseError) {
        data = null;
      }

      if (!response.ok) {
        if (data?.error === "Invalid ZIP") {
          const suggestion = data?.suggestion || null;
          const messageText =
            data?.message || formatZipSuggestionMessage(suggestion);
          setZipFeedback({
            type: suggestion ? "suggestion" : "error",
            message: messageText,
            suggestion,
          });
          if (!suggestion) {
            setError(messageText);
          }
          return;
        }

        const errorMessage = data?.error || "Unable to create jobseeker profile.";
        throw new Error(errorMessage);
      }

      const loginResult = await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      if (loginResult?.error) {
        throw new Error("Account created, but sign in failed. Try logging in manually.");
      }

      router.push("/jobseeker/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      turnstileRef.current?.reset?.();
      setLoading(false);
    }
  }

  const zipSuggestionLocation = formatZipSuggestionLocation(zipFeedback?.suggestion);

  return (
    <main className="form-page">
      <h1 className="form-heading">Create Jobseeker Profile</h1>
      <form onSubmit={handleSubmit} className="form-stack">
        <label className="form-label">
          First Name
          <input
            className="form-input"
            value={form.firstName}
            onChange={updateField("firstName")}
          />
        </label>
        <label className="form-label">
          Last Name
          <input
            className="form-input"
            value={form.lastName}
            onChange={updateField("lastName")}
          />
        </label>
        <label className="form-label">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            className="form-input"
            value={form.email}
            onChange={updateField("email")}
          />
        </label>
        <label className="form-label">
          Password
          <input
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="form-input"
            value={form.password}
            onChange={updateField("password")}
          />
        </label>
        <label className="form-label">
          Mobile Phone
          <input
            type="tel"
            required
            autoComplete="tel"
            className="form-input"
            value={form.mobilePhone}
            onChange={updateField("mobilePhone")}
          />
        </label>
        <label className="form-label">
          Address Line 1
          <input
            className="form-input"
            value={form.address1}
            onChange={updateField("address1")}
          />
        </label>
        <label className="form-label">
          Address Line 2
          <input
            className="form-input"
            value={form.address2}
            onChange={updateField("address2")}
          />
        </label>
        <label className="form-label">
          City
          <input
            className="form-input"
            value={form.city}
            onChange={updateField("city")}
          />
        </label>
        <label className="form-label">
          State
          <StateSelect
            value={form.state}
            onChange={updateField("state")}
          />
        </label>
        <label className="form-label">
          Zip Code
          <input
            className="form-input"
            value={form.zipCode}
            onChange={updateField("zipCode")}
          />
          {zipFeedback?.type === "suggestion" ? (
            <span className="form-hint">
              That ZIP was unrecognized. Try using{' '}
              <button
                type="button"
                onClick={() => applyZipSuggestion(zipFeedback.suggestion)}
                className="font-semibold text-sky-600 underline"
              >
                {zipFeedback.suggestion?.zip}
              </button>
              {zipSuggestionLocation ? ` from ${zipSuggestionLocation}` : ''}
              {' '}instead.
            </span>
          ) : null}
          {zipFeedback?.type === "error" ? (
            <span className="form-error">{zipFeedback.message}</span>
          ) : null}
        </label>
        <label className="form-label">
          Trade/Craft
          <select
            required
            className="form-input"
            value={form.trade}
            onChange={updateField("trade")}
          >
            <option value="" disabled>
              Select your trade
            </option>
            {TRADES.map((trade) => (
              <option key={trade} value={trade}>
                {trade}
              </option>
            ))}
          </select>
        </label>
        <div className="form-label">
          Journeyman License
          <div>
            <label>
              <input
                type="radio"
                name="hasJourneymanLicense"
                value="yes"
                checked={form.hasJourneymanLicense === "yes"}
                onChange={updateJourneymanLicense}
              />
              <span className="ml-2">Yes</span>
            </label>
          </div>
          <div>
            <label>
              <input
                type="radio"
                name="hasJourneymanLicense"
                value="no"
                checked={form.hasJourneymanLicense === "no"}
                onChange={updateJourneymanLicense}
              />
              <span className="ml-2">No</span>
            </label>
          </div>
        </div>
        {form.hasJourneymanLicense === "yes" ? (
          <label className="form-label">
            Licensed States
            <select
              multiple
              className="form-input"
              value={form.licensedStates}
              onChange={updateLicensedStates}
            >
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <p className="form-hint">
          Note: Employers cannot contact you if you do not upload a resume. Please include your phone number and resume for best
          results.
        </p>
        <label className="form-label">
          Resume (optional)
          <input type="file" className="form-input" onChange={handleResumeChange} />
          {resumeName ? <span className="form-hint">Selected: {resumeName}</span> : null}
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <TurnstileWidget ref={turnstileRef} siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Creating profile…" : "Create profile"}
        </button>
      </form>
      <p className="form-footer-link">
        Already have an account? <Link href="/jobseeker/login">Sign in</Link>
      </p>
    </main>
  );
}
