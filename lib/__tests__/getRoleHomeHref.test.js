import { getRoleHomeHref } from "../getRoleHomeHref";
import { ROLE_ROUTES } from "../roleRoutes";

describe("getRoleHomeHref", () => {
  it("returns the employer dashboard for employer role", () => {
    expect(getRoleHomeHref("employer")).toBe(ROLE_ROUTES.employer);
  });

  it("returns the public jobs route for jobseekers", () => {
    expect(getRoleHomeHref("jobseeker")).toBe(ROLE_ROUTES.jobseeker);
  });

  it("falls back to root for unknown roles", () => {
    expect(getRoleHomeHref("unknown")).toBe("/");
  });
});
