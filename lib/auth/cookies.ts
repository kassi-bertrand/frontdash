/**
 * Cookie Management
 *
 * Centralized cookie names and helper functions for authentication.
 * All cookies are httpOnly for security (see config.ts).
 *
 * Important: These cookies are only readable by the server.
 * Client components should use the useAuth hook (hooks/use-auth.ts)
 * which calls /api/auth/me to get user data.
 */

import { NextResponse } from "next/server";
import { COOKIE_OPTIONS } from "./config";
import type { AuthUser } from "./types";

/**
 * Cookie names used for authentication.
 * Prefix "fd_" = FrontDash to avoid conflicts.
 */
export const AUTH_COOKIES = {
  /** User role: "admin" | "staff" | "restaurant" */
  ROLE: "fd_role",
  /** Username for display purposes */
  USERNAME: "fd_username",
  /** Staff member's database ID (staff users only) */
  STAFF_ID: "fd_staff_id",
  /** Restaurant's database ID (restaurant users only) */
  RESTAURANT_ID: "fd_restaurant_id",
  /** Flag indicating staff must change password on first login */
  MUST_CHANGE_PWD: "fd_must_change_pwd",
} as const;

/**
 * Set httpOnly auth cookies after successful login.
 * Cookies are set based on the user's role:
 * - All users: role, username
 * - Staff: staffId, mustChangePassword flag
 * - Restaurant: restaurantId
 *
 * @param res - NextResponse to set cookies on
 * @param user - Authenticated user data (from authenticateUser)
 */
export function setAuthCookies(res: NextResponse, user: AuthUser): void {
  res.cookies.set(AUTH_COOKIES.ROLE, user.role, COOKIE_OPTIONS);
  res.cookies.set(AUTH_COOKIES.USERNAME, user.username, COOKIE_OPTIONS);

  if (user.role === "staff") {
    res.cookies.set(AUTH_COOKIES.STAFF_ID, String(user.staffId), COOKIE_OPTIONS);
    if (user.mustChangePassword) {
      res.cookies.set(AUTH_COOKIES.MUST_CHANGE_PWD, "1", COOKIE_OPTIONS);
    }
  }

  if (user.role === "restaurant") {
    res.cookies.set(AUTH_COOKIES.RESTAURANT_ID, String(user.restaurantId), COOKIE_OPTIONS);
  }
}

/**
 * Clear all auth cookies on logout.
 * Called by /api/logout route.
 *
 * @param res - NextResponse to clear cookies on
 */
export function clearAuthCookies(res: NextResponse): void {
  for (const name of Object.values(AUTH_COOKIES)) {
    res.cookies.delete({ name, path: "/" });
  }
}
