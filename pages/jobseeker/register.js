import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signIn, useSession } from "next-auth/react";
import { TRADES } from "@/lib/trades";

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];

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

export default function JobseekerRegisterPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [form, setForm] = useState(initialForm);
  const [resumeName, setResumeName] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user?.role) return;
    if (session.user.role === "jobseeker") {
      router.replace("/jobseeker/dashboard");
    } else {
      router.replace("/employer/dashboard");
    }
  }, [router, session]);

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const updateJourneymanLicense = (event) => {
    const value = event.target.value;
    setForm((prev) => ({
      ...prev,
      hasJourneymanLicense: value,
      licensedStates: value === "yes" ? prev.licensedStates : [],
    }));
  };

  const updateLicensedStates = (event) => {
    const selected = Array.from(event.target.selectedOptions || [], (option) => option.value);
    setForm((prev) => ({ ...prev, licensedStates: selected }));
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

    try {
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

      if (form.hasJourneymanLicense === "yes" && form.licensedStates.length === 0) {
        throw new Error("Select at least one state for your journeyman license.");
      }

      const hasJourneymanLicense = form.hasJourneymanLicense === "yes";
      const licensedStates = hasJourneymanLicense ? form.licensedStates : [];

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
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Unable to create jobseeker profile.");
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
      setLoading(false);
    }
  }

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
          <input
            className="form-input"
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
                <option key={state} value={state}>
                  {state}
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
