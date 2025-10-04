export function encodeProfile(obj) {
  if (!obj) return {};

  const toNullableString = (value) => {
    if (value == null) return null;
    const trimmed = `${value}`.trim();
    return trimmed.length > 0 ? trimmed : null;
  };

  let completedAt = obj.completedAt ? new Date(obj.completedAt) : new Date();
  if (Number.isNaN(completedAt.getTime())) {
    completedAt = new Date();
  }

  return {
    companyName: `${obj.companyName}`.trim(),
    website: toNullableString(obj.website),
    phone: toNullableString(obj.phone),
    location: toNullableString(obj.location),
    notes: toNullableString(obj.notes),
    completedAt,
  };
}

export function decodeProfile(profile) {
  if (!profile) return null;

  return {
    companyName: profile.companyName || "",
    website: profile.website || "",
    phone: profile.phone || "",
    location: profile.location || "",
    notes: profile.notes || "",
    completedAt:
      profile.completedAt instanceof Date
        ? profile.completedAt.toISOString()
        : profile.completedAt || null,
  };
}
