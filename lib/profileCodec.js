export function encodeProfile(obj) {
  try {
    return obj ? JSON.stringify(obj) : null;
  } catch {
    return null;
  }
}

export function decodeProfile(val) {
  if (val == null) return null;
  if (typeof val !== "string") return val;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}
