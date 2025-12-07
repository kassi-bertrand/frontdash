/**
 * Authentication Module
 *
 * Centralized auth utilities for the FrontDash frontend.
 * Import from "@/lib/auth" for all auth-related functionality.
 *
 * @example
 * ```ts
 * import { authenticateUser, AuthError, type AuthUser } from "@/lib/auth";
 * ```
 *
 * Module structure:
 * - config.ts   → API URL, cookie options
 * - types.ts    → TypeScript types (AuthUser, etc.)
 * - schemas.ts  → Zod validation schemas
 * - cookies.ts  → Cookie management (httpOnly)
 * - handlers.ts → Core auth logic (authenticateUser)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
export { API_URL, COOKIE_OPTIONS, ROLE_DASHBOARDS } from "./config";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export type {
  BackendRole,
  FrontendRole,
  AdminUser,
  StaffUser,
  RestaurantUser,
  AuthUser,
  SignInResponse,
  AuthErrorResponse,
} from "./types";
export { toFrontendRole, parseFrontendRole } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Schemas (Zod validation)
// ─────────────────────────────────────────────────────────────────────────────
export {
  SignInRequestSchema,
  BackendLoginResponseSchema,
  parseSignInRequest,
  parseBackendResponse,
} from "./schemas";
export type { SignInRequest, BackendLoginResponse } from "./schemas";

// ─────────────────────────────────────────────────────────────────────────────
// Cookies
// ─────────────────────────────────────────────────────────────────────────────
export { AUTH_COOKIES, setAuthCookies, clearAuthCookies } from "./cookies";

// ─────────────────────────────────────────────────────────────────────────────
// Handlers
// ─────────────────────────────────────────────────────────────────────────────
export { AuthError, authenticateUser, getRedirectPath } from "./handlers";
