import { test } from "@playwright/test";

test.describe("role routing", () => {
  test.skip("anonymous user can view employer registration", async ({ page }) => {
    await page.goto("/employer/register");
  });

  test.skip("anonymous user can view jobseeker registration", async ({ page }) => {
    await page.goto("/jobseeker/register");
  });

  test.skip("jobs route renders search params without gating", async ({ page }) => {
    await page.goto("/jobs?q=foreman&location=Houston%2C%20TX&trade=Electrical&payMin=35");
  });
});
