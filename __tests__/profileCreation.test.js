jest.mock("../lib/prisma", () => {
  const client = {
    user: { findUnique: jest.fn() },
    employerProfile: { create: jest.fn() },
    $transaction: jest.fn(async (callback) =>
      callback({
        user: { create: jest.fn(async (args) => ({ id: "test-user", ...args.data })) },
        employerProfile: { create: jest.fn(async (args) => args.data) },
      })
    ),
  };

  return {
    __esModule: true,
    default: client,
    prisma: client,
  };
});

describe("profile creation builders", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it("constructs a complete employer profile payload with sanitised fields", async () => {
    const { buildEmployerProfile } = await import("../pages/api/auth/register.js");

    const payload = {
      companyName: "  ACME Co  ",
      firstName: "  Jane  ",
      lastName: "  Smith  ",
      phone: "",
      mobilePhone: "555-0100",
      officePhone: " 555-0101 ",
      address1: " 123 Main St ",
      address2: "  Suite 4  ",
      city: "  Phoenix ",
      state: " AZ ",
      zip: " 85004 ",
      timezone: " MST ",
      website: " https://example.com ",
    };

    const profile = buildEmployerProfile(payload);
    expect(profile).toMatchObject({
      companyName: "ACME Co",
      firstName: "Jane",
      lastName: "Smith",
      phone: "555-0100",
      address1: "123 Main St",
      city: "Phoenix",
      state: "AZ",
      zip: "85004",
      mobilePhone: "555-0100",
      officePhone: "555-0101",
      website: "https://example.com",
      timezone: "MST",
    });
    expect(profile).not.toHaveProperty("address2");
  });

  it("surfaces errors when required employer fields are missing", async () => {
    const { buildEmployerProfile } = await import("../pages/api/auth/register.js");

    const invalid = buildEmployerProfile({
      companyName: "",
      firstName: "",
      lastName: "",
      email: "",
      mobilePhone: "",
      address1: "",
      city: "",
      state: "",
      zip: "",
    });

    expect(invalid).toBeInstanceOf(Error);
    expect(invalid.message).toContain("Company name is required");
  });

  it("constructs a jobseeker profile using the provided account email", async () => {
    const { buildJobseekerProfile } = await import("../pages/api/auth/register.js");

    const payload = {
      firstName: "  John  ",
      lastName: "  Doe  ",
      address1: " 456 Market St ",
      city: "  Austin ",
      state: " TX ",
      zipCode: " 78701 ",
      trade: "  Electrician  ",
    };

    const profile = buildJobseekerProfile(payload, "john@example.com");
    expect(profile).toMatchObject({
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      address1: "456 Market St",
      city: "Austin",
      state: "TX",
      zip: "78701",
      trade: "Electrician",
    });
  });

  it("requires a trade selection for jobseeker profiles", async () => {
    const { buildJobseekerProfile } = await import("../pages/api/auth/register.js");
    const invalid = buildJobseekerProfile({}, "someone@example.com");
    expect(invalid).toBeInstanceOf(Error);
    expect(invalid.message).toContain("Trade selection is required");
  });

  it("allows employer registration without an office phone number", async () => {
    const { default: handler } = await import("../pages/api/auth/register.js");
    const prisma = (await import("../lib/prisma")).default;

    prisma.user.findUnique.mockResolvedValue(null);
    prisma.$transaction.mockImplementation(async (callback) =>
      callback({
        user: { create: jest.fn(async () => ({ id: "user-123" })) },
        employerProfile: { create: jest.fn(async (args) => args.data) },
      })
    );

    const req = {
      method: "POST",
      body: {
        role: "employer",
        email: "owner@example.com",
        password: "supersafe",
        firstName: "Alicia",
        lastName: "Keys",
        companyName: "Keys Construction",
        mobilePhone: "555-0100",
        addressLine1: "1 Music Way",
        city: "Nashville",
        state: "TN",
        zip: "37203",
      },
    };

    const json = jest.fn();
    const res = {
      status: jest.fn(() => ({ json })),
      setHeader: jest.fn(),
    };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ success: true });
  });
});
