/** @jest-environment node */
import handler from "../pages/api/resumes/search";
import prisma from "../lib/prisma";
import { getServerSession } from "next-auth/next";
import { geocodeZip } from "../lib/utils/geocode";

jest.mock("next-auth/next", () => ({ getServerSession: jest.fn() }));
jest.mock("../lib/authOptions", () => ({ __esModule: true, default: {} }));
jest.mock("../lib/prisma", () => ({ __esModule: true, default: { $queryRaw: jest.fn() } }));
jest.mock("../lib/utils/geocode", () => ({ geocodeZip: jest.fn() }));

const candidate = { id: "candidate-1", resumeUrl: "resume.pdf", total_count: 1 };

async function search(query) {
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
  await handler({ method: "GET", query }, res);
  expect(res.status).toHaveBeenCalledWith(200);
  return res;
}

function expectCertificationPredicate(query, pattern) {
  expect(query.text).toContain('OR jsp.certifications ILIKE');
  expect(query.text).toContain('OR EXISTS');
  expect(query.text).toContain('public.jobseekerprofile_certifications');
  expect(query.text).toContain('public.certifications_catalog');
  expect(query.text).toContain('certification.id = selected_certification.certification_id');
  expect(query.text).toContain('selected_certification.jobseekerprofile_id = jsp.id');
  expect(query.text).toContain('certification.name ILIKE');
  expect(query.values.filter(value => value === pattern)).toHaveLength(6);
  expect(query.text).toContain('jsp."resumeUrl" IS NOT NULL');
}

describe("resume certification keyword search", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    getServerSession.mockResolvedValue({ user: { id: "employer-1", role: "employer" } });
    geocodeZip.mockResolvedValue({ lat: 36, lon: -96 });
  });

  it.each(["OSHA", "safety training", "OSHA 30", "fork"])("matches %s in both regular count and results queries", async keyword => {
    prisma.$queryRaw.mockResolvedValueOnce([{ total_count: 1 }]).mockResolvedValueOnce([candidate]);
    const res = await search({ keyword: ` ${keyword} `, page: "1", pageSize: "25", state: "OK", licensedOnly: "true" });
    for (const [query] of prisma.$queryRaw.mock.calls) {
      expectCertificationPredicate(query, `%${keyword}%`);
      expect(query.text).toContain('jsp."hasJourneymanLicense" = true');
      expect(query.values).toContain("OK");
    }
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ totalCount: 1, candidates: [expect.objectContaining({ id: candidate.id })] }));
  });

  it("uses certification matching with radius filtering and pagination", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([candidate]);
    await search({ keyword: "OSHA", zip: "74063", radius: "50", page: "2", pageSize: "25" });
    const query = prisma.$queryRaw.mock.calls[0][0];
    expectCertificationPredicate(query, "%OSHA%");
    expect(query.text).toContain("earth_distance");
    expect(query.text).toContain("LIMIT");
    expect(query.text).toContain("OFFSET");
  });

  it("keeps radius counts consistent on an empty page", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([]).mockResolvedValueOnce([{ total_count: 1 }]);
    await search({ keyword: "OSHA", zip: "74063", radius: "50", page: "2" });
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
    for (const [query] of prisma.$queryRaw.mock.calls) expectCertificationPredicate(query, "%OSHA%");
  });

  it("treats SQL wildcard characters as literal text and parameterizes input", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ total_count: 0 }]).mockResolvedValueOnce([]);
    const keyword = "50%_\\' OR 1=1 --";
    await search({ keyword });
    for (const [query] of prisma.$queryRaw.mock.calls) {
      expectCertificationPredicate(query, "%50\\%\\_\\\\' OR 1=1 --%");
      expect(query.text).not.toContain(keyword);
    }
  });

  it("does not add certification lookups for an empty keyword", async () => {
    prisma.$queryRaw.mockResolvedValueOnce([{ total_count: 0 }]).mockResolvedValueOnce([]);
    await search({ keyword: "   " });
    for (const [query] of prisma.$queryRaw.mock.calls) expect(query.text).not.toContain("certifications_catalog");
  });
});
