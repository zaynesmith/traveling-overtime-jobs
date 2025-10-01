import { test } from "@playwright/test";

test.describe("role routing", () => {
  test.skip("anonymous user hitting employer register is prompted to sign in", async ({ page }) => {
    await page.goto("/employer/register?onboarding=1");
  });

  test.skip("no-role user sees the role picker on employer register", async ({ page }) => {
    // This flow requires Clerk session stubbing; left as a placeholder for future wiring.
  });

  test.skip("jobseeker role cannot access employer register", async ({ page }) => {
    // TODO: integrate Clerk testing helpers and assert forbidden UI.
  });

  test.skip("employer role sees the register form", async ({ page }) => {
    // TODO: authenticate as employer and assert the form renders.
  });

  test.skip("jobs route renders search params without gating", async ({ page }) => {
    await page.goto("/jobs?q=foreman&location=Houston%2C%20TX&trade=Electrical&payMin=35");
  });
});
