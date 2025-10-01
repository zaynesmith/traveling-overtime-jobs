// Simple, resilient LS helpers (no-throw)
const KEY = "toj.onboarding";
function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function write(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj || {})); } catch {}
}

export function setOnboardingIntent(role /* "employer"|"jobseeker" */) {
  const data = read();
  data.intent = role;
  write(data);
}
export function getOnboardingIntent() {
  return read().intent || null;
}

export function saveEmployerDraft(draft) {
  const data = read();
  data.employerDraft = { ...(data.employerDraft || {}), ...(draft || {}) };
  write(data);
}
export function loadEmployerDraft() {
  return read().employerDraft || null;
}
export function clearOnboarding() {
  write({});
}
