/**
 * Authentication Configuration
 * Centralized config for API URL, cookie settings, and role dashboards
 */

import type { FrontendRole } from "./types";

/** Express backend API URL */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

/** httpOnly cookie options for secure auth */
export const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60, // 1 hour
};

/**
 * Default dashboard path for each role.
 * Used by middleware for redirects and handlers for post-login navigation.
 */
export const ROLE_DASHBOARDS: Record<FrontendRole, string> = {
  admin: "/admin/dashboard",
  staff: "/staff",
  restaurant: "/restaurant/dashboard",
};
