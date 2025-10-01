import { ROLE_ROUTES } from "./roleRoutes";

export function getRoleHomeHref(role) {
  return ROLE_ROUTES[role] ?? "/";
}
