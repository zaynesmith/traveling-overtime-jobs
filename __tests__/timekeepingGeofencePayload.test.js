import {
  extractGeofenceOutcome,
  sanitizeAccuracy,
  sanitizeLocation,
  sanitizeLocationStatus,
} from "../pages/api/jobseeker/timekeeping";

describe("timekeeping geofence payload helpers", () => {
  it("sanitizes location and accuracy values", () => {
    expect(sanitizeLocation(29.76)).toBe(29.76);
    expect(sanitizeLocation("29.76")).toBeNull();
    expect(sanitizeAccuracy(5)).toBe(5);
    expect(sanitizeAccuracy(-5)).toBeNull();
  });

  it("normalizes supported location statuses", () => {
    expect(sanitizeLocationStatus("available")).toBe("available");
    expect(sanitizeLocationStatus("PERMISSION_DENIED")).toBe("permission_denied");
    expect(sanitizeLocationStatus("random")).toBe("unavailable");
  });

  it("extracts geofence object when rpc row provides first-class geofence payload", () => {
    const geofence = { inside: false, enforcement: "hard", canRequestOverride: true };
    expect(extractGeofenceOutcome([{ geofence }])).toEqual(geofence);
  });

  it("extracts geofence fields from legacy rpc columns", () => {
    expect(
      extractGeofenceOutcome([
        {
          geofence_inside: false,
          geofence_enforcement: "soft",
          geofence_override_available: false,
          geofence_reason: "outside radius",
        },
      ])
    ).toEqual({
      inside: false,
      enforcement: "soft",
      canRequestOverride: false,
      reason: "outside radius",
    });
  });
});
