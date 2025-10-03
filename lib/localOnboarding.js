const INTENT_KEY = "toj.onboarding.intent";
const EMPLOYER_DRAFT_KEY = "toj.employerDraft";

export function setOnboardingIntent(intent) {
  if (typeof window === "undefined") return;
  try {
    if (intent) {
      window.localStorage.setItem(INTENT_KEY, intent);
    } else {
      window.localStorage.removeItem(INTENT_KEY);
    }
  } catch (error) {
    console.warn("Unable to store onboarding intent", error);
  }
}

export function getOnboardingIntent() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(INTENT_KEY);
  } catch (error) {
    console.warn("Unable to read onboarding intent", error);
    return null;
  }
}

export function clearOnboardingIntent() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(INTENT_KEY);
  } catch (error) {
    console.warn("Unable to clear onboarding intent", error);
  }
}

export function saveEmployerDraft(draft) {
  if (typeof window === "undefined") return;
  try {
    const existing = loadEmployerDraft() || {};
    const next = { ...existing, ...(draft || {}) };
    window.localStorage.setItem(EMPLOYER_DRAFT_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn("Unable to save employer draft", error);
  }
}

export function loadEmployerDraft() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(EMPLOYER_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Unable to read employer draft", error);
    return null;
  }
}

export function clearEmployerDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(EMPLOYER_DRAFT_KEY);
  } catch (error) {
    console.warn("Unable to clear employer draft", error);
  }
}
