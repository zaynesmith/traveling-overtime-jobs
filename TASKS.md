# Audit Tasks

## Typo Fix
- **Issue**: The signed-out navigation button labeled "Jobseeker Login" actually links to the sign-up route, so the text should say "Sign Up" (or the link should change). 【F:components/Nav.js†L29-L32】
- **Proposed Task**: Update the button label (or destination) so the copy matches the `/sign-up` flow for jobseekers.

## Bug Fix
- **Issue**: `_app.js` imports `../components/Header`, but the actual file on disk is `components/header.js`. On case-sensitive filesystems this throws a module not found error. 【F:pages/_app.js†L1-L12】【F:components/header.js†L1-L30】
- **Proposed Task**: Align the import path casing (or rename the file) so the app builds on case-sensitive environments.

## Comment/Documentation Discrepancy
- **Issue**: The inline comment in the job search page says the SignedOut prompt is shown when a user signs out mid-session, but because it is nested inside a `<SignedIn>` block it never renders in that state. 【F:pages/jobseeker/search.js†L154-L258】
- **Proposed Task**: Adjust the comment (and optionally the component structure) so the documentation reflects the actual behavior.

## Test Improvement
- **Issue**: The job detail page’s `applyNow` logic guards against duplicate applications and persists to `localStorage`, but there is no automated coverage to prevent regressions. 【F:pages/jobs/[id].js†L39-L118】
- **Proposed Task**: Add a React Testing Library test (with mocked `localStorage`) that exercises `applyNow`, ensuring duplicate submissions are blocked and successful applications persist.
