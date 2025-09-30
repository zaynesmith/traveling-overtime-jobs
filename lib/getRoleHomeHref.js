export function getRoleHomeHref(role) {
  if (role === "employer") return "/employer/dashboard";
  if (role === "jobseeker") return "/jobseeker/dashboard";
  return "/";
}
