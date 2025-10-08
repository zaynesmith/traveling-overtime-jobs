export function encodeProfile(obj) {
  if (!obj) return {};

  const valueFrom = (candidates) => {
    const keys = Array.isArray(candidates) ? candidates : [candidates];
    for (const key of keys) {
      if (key in obj && obj[key] != null) {
        return obj[key];
      }
    }
    return undefined;
  };

  const toRequiredString = (candidates, fieldName) => {
    const value = valueFrom(candidates);
    const label = fieldName || (Array.isArray(candidates) ? candidates[0] : candidates);
    if (value == null) {
      throw new Error(`Missing required field: ${label}`);
    }

    const trimmed = `${value}`.trim();
    if (!trimmed) {
      throw new Error(`Missing required field: ${label}`);
    }
    return trimmed;
  };

  const toNullableString = (candidates) => {
    const value = valueFrom(candidates);
    if (value == null) return null;
    const trimmed = `${value}`.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  let completedAt = valueFrom(["completedAt"]);
  completedAt = completedAt ? new Date(completedAt) : new Date();
  if (Number.isNaN(completedAt.getTime())) {
    completedAt = new Date();
  }

  return {
    companyName: toRequiredString(["companyName"], "companyName"),
    firstName: toRequiredString(["firstName", "firstname"], "firstName"),
    lastName: toRequiredString(["lastName", "lastname"], "lastName"),
    phone: toRequiredString(["phone", "mobilePhone", "mobilephone"], "phone"),
    address1: toRequiredString(["address1", "addressLine1"], "address1"),
    city: toRequiredString(["city"], "city"),
    state: toRequiredString(["state"], "state"),
    zip: toRequiredString(["zip", "zipCode"], "zip"),
    mobilePhone: toRequiredString(["mobilePhone", "mobilephone"], "mobilePhone"),
    address2: toNullableString(["address2", "addressLine2"]),
    officePhone: toNullableString(["officePhone", "officephone"]),
    website: toNullableString(["website"]),
    timezone: toNullableString(["timezone"]),
    location: toNullableString(["location"]),
    notes: toNullableString(["notes"]),
    completedAt,
  };
}

export function decodeProfile(profile) {
  if (!profile) return null;

  const toStringOrEmpty = (value) => (value == null ? "" : `${value}`);

  return {
    companyName: toStringOrEmpty(profile.companyName),
    firstName: toStringOrEmpty(profile.firstName),
    lastName: toStringOrEmpty(profile.lastName),
    phone: toStringOrEmpty(profile.phone),
    address1: toStringOrEmpty(profile.address1),
    address2: toStringOrEmpty(profile.address2),
    city: toStringOrEmpty(profile.city),
    state: toStringOrEmpty(profile.state),
    zip: toStringOrEmpty(profile.zip),
    mobilePhone: toStringOrEmpty(profile.mobilePhone),
    officePhone: toStringOrEmpty(profile.officePhone),
    website: toStringOrEmpty(profile.website),
    timezone: toStringOrEmpty(profile.timezone),
    location: toStringOrEmpty(profile.location),
    notes: toStringOrEmpty(profile.notes),
    completedAt:
      profile.completedAt instanceof Date
        ? profile.completedAt.toISOString()
        : profile.completedAt || null,
  };
}
