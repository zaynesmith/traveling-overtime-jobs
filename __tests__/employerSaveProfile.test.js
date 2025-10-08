jest.mock("next-auth/next", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("../lib/prisma", () => {
  const client = {
    user: { update: jest.fn() },
    employerProfile: { findUnique: jest.fn() },
  };

  return {
    __esModule: true,
    default: client,
    prisma: client,
  };
});

const { getServerSession } = require("next-auth/next");
const prisma = require("../lib/prisma").default;

describe("POST /api/employer/save-profile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a complete employer profile when none exists", async () => {
    const profilePayload = {
      companyName: "ACME Builders",
      firstName: "Jane",
      lastName: "Doe",
      mobilePhone: "555-0100",
      addressLine1: "123 Main St",
      city: "Phoenix",
      state: "AZ",
      zip: "85004",
    };

    getServerSession.mockResolvedValue({ user: { id: "user-1" } });
    prisma.employerProfile.findUnique.mockResolvedValue(null);

    prisma.user.update.mockImplementation(async (args) => {
      const createPayload = args?.data?.employerProfile?.upsert?.create;
      expect(createPayload).toMatchObject({
        companyName: "ACME Builders",
        firstName: "Jane",
        lastName: "Doe",
        mobilePhone: "555-0100",
        phone: "555-0100",
        address1: "123 Main St",
        city: "Phoenix",
        state: "AZ",
        zip: "85004",
      });

      return {
        id: "user-1",
        email: "jane@example.com",
        role: "employer",
        employerProfile: {
          ...createPayload,
        },
      };
    });

    const { default: handler } = await import("../pages/api/employer/save-profile.js");

    const json = jest.fn();
    const res = {
      status: jest.fn(() => ({ json })),
      setHeader: jest.fn(),
    };

    await handler(
      { method: "POST", body: { profile: profilePayload } },
      res
    );

    expect(prisma.user.update).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        employerProfile: expect.objectContaining({
          companyName: "ACME Builders",
          firstName: "Jane",
          lastName: "Doe",
          mobilePhone: "555-0100",
          phone: "555-0100",
          address1: "123 Main St",
          city: "Phoenix",
          state: "AZ",
          zip: "85004",
        }),
      })
    );
  });
});
