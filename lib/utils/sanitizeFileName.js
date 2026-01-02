export default function sanitizeFileName(fileName) {
  if (typeof fileName !== "string") {
    return `resume-${Date.now()}`;
  }
  const trimmed = fileName.trim().replace(/[\\/]/g, "_");
  if (!trimmed) {
    return `resume-${Date.now()}`;
  }
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_");
}
