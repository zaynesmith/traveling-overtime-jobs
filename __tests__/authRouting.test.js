jest.mock("../lib/prisma", () => {
  const client = {
    user: { findUnique: jest.fn() },
  };

  return {
    __esModule: true,
    default: client,
    prisma: client,
  };
});

describe("authentication routing integration", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("exposes the jobseeker login page as the NextAuth sign-in route", async () => {
    const { authOptions } = await import("../lib/authOptions.js");
    expect(authOptions.pages.signIn).toBe("/jobseeker/login");
  });

  it("persists the user role inside the JWT token after login", async () => {
    const { authOptions } = await import("../lib/authOptions.js");

    const token = {};
    const updated = await authOptions.callbacks.jwt({
      token,
      user: { id: "abc", role: "employer" },
    });

    expect(updated.role).toBe("employer");
    expect(updated.sub).toBe("abc");
  });

  it("hydrates the role from the database when refreshing a JWT session", async () => {
    const prismaModule = await import("../lib/prisma.js");
    prismaModule.default.user.findUnique.mockResolvedValue({
      id: "abc",
      role: "jobseeker",
    });

    const { authOptions } = await import("../lib/authOptions.js");
    const token = { sub: "abc" };
    const refreshed = await authOptions.callbacks.jwt({ token });
    expect(refreshed.role).toBe("jobseeker");
  });

  it("attaches the role to the client session payload", async () => {
    const { authOptions } = await import("../lib/authOptions.js");
    const session = { user: {} };
    const token = { sub: "abc", role: "jobseeker" };
    const hydrated = await authOptions.callbacks.session({ session, token });
    expect(hydrated.user.role).toBe("jobseeker");
    expect(hydrated.user.id).toBe("abc");
  });
});
