/**
 * Authentication Types
 * Discriminated unions for type-safe role handling
 */

/** Backend role enum (uppercase) */
export type BackendRole = "ADMIN" | "STAFF" | "RESTAURANT";

/** Frontend role enum (lowercase) */
export type FrontendRole = "admin" | "staff" | "restaurant";

/** Admin user - minimal data */
export interface AdminUser {
  role: "admin";
  username: string;
}

/** Staff user - includes staffId and password change flag */
export interface StaffUser {
  role: "staff";
  username: string;
  staffId: number;
  mustChangePassword: boolean;
}

/** Restaurant user - includes restaurantId and restaurantName */
export interface RestaurantUser {
  role: "restaurant";
  username: string;
  restaurantId: number;
  restaurantName: string;
}

/** Discriminated union of all user types */
export type AuthUser = AdminUser | StaffUser | RestaurantUser;

/** Response from Next.js sign-in API */
export interface SignInResponse {
  success: boolean;
  user: AuthUser;
  redirect: string;
  message?: string;
}

/** Error response */
export interface AuthErrorResponse {
  success: false;
  message: string;
}

/**
 * Maps backend role (uppercase) to frontend role (lowercase).
 * Uses explicit mapping to catch unexpected roles at runtime.
 */
const ROLE_MAP: Record<BackendRole, FrontendRole> = {
  ADMIN: "admin",
  STAFF: "staff",
  RESTAURANT: "restaurant",
};

/**
 * Convert backend role to frontend role with runtime validation.
 * @throws Error if backend returns an unexpected role
 */
export function toFrontendRole(backendRole: BackendRole): FrontendRole {
  const frontendRole = ROLE_MAP[backendRole];
  if (!frontendRole) {
    throw new Error(`Unknown backend role: ${backendRole}`);
  }
  return frontendRole;
}

/** Valid frontend roles for runtime validation */
const VALID_FRONTEND_ROLES: readonly FrontendRole[] = ["admin", "staff", "restaurant"];

/**
 * Safely parse a cookie value into a FrontendRole.
 * Returns undefined for invalid/missing values instead of using unsafe casts.
 *
 * @param value - Raw cookie value (could be tampered with)
 * @returns Valid FrontendRole or undefined
 */
export function parseFrontendRole(value: string | undefined): FrontendRole | undefined {
  if (!value) return undefined;
  if (VALID_FRONTEND_ROLES.includes(value as FrontendRole)) {
    return value as FrontendRole;
  }
  return undefined;
}
