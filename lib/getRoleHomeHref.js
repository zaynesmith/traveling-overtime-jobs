export function getRoleHomeHref(role) {
  if (role === "employer") return "/employer";
  if (role === "jobseeker") return "/jobseeker";
  return "/";
}
