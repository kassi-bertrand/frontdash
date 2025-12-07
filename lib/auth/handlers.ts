/**
 * Authentication Handlers
 * Core auth logic - single implementation used by all routes
 */

import { API_URL, ROLE_DASHBOARDS } from "./config";
import { parseBackendResponse, type BackendLoginResponse } from "./schemas";
import { toFrontendRole, type AuthUser, type FrontendRole } from "./types";

/**
 * Custom error class for authentication failures.
 * Includes HTTP status code for proper API response handling.
 *
 * @example
 * ```ts
 * throw new AuthError(401, "Invalid credentials");
 * // In route handler:
 * if (error instanceof AuthError) {
 *   return NextResponse.json({ message: error.message }, { status: error.statusCode });
 * }
 * ```
 */
export class AuthError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Authenticate user credentials against the Express backend.
 *
 * Flow:
 * 1. POST credentials to backend /api/auth/login
 * 2. Validate response structure with Zod schema
 * 3. Check role restriction if specified
 * 4. Build typed AuthUser object
 *
 * @param username - User's login username
 * @param password - User's plaintext password (sent over HTTPS)
 * @param requiredRole - Optional role restriction (e.g., "restaurant" for restaurant portal)
 * @returns Authenticated user data and raw backend response
 *
 * @throws {AuthError} 401 - Invalid credentials or role mismatch
 * @throws {AuthError} 502 - Backend returned invalid response structure
 *
 * @example
 * ```ts
 * const { user } = await authenticateUser("john", "secret123", "staff");
 * // user is typed as StaffUser since we required "staff" role
 * ```
 */
export async function authenticateUser(
  username: string,
  password: string,
  requiredRole?: FrontendRole
): Promise<{ user: AuthUser; backendData: BackendLoginResponse }> {
  // Call Express backend
  let rawData: unknown;
  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    rawData = await response.json();

    // Handle backend error
    if (!response.ok) {
      const errorData = rawData as { error?: string };
      throw new AuthError(
        response.status,
        errorData.error || "Invalid credentials"
      );
    }
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(502, "Failed to connect to authentication server");
  }

  // Validate response structure
  const parsed = parseBackendResponse(rawData);
  if (!parsed.success) {
    throw new AuthError(502, parsed.message);
  }

  const backendData = parsed.data;
  const role = toFrontendRole(backendData.role);

  // Check role restriction if specified
  if (requiredRole && role !== requiredRole) {
    throw new AuthError(401, `This login is for ${requiredRole} accounts only`);
  }

  // Build user object based on role
  const user = buildAuthUser(backendData, role);

  return { user, backendData };
}

/**
 * Build typed AuthUser from backend response.
 * Validates required fields per role and throws if missing.
 */
function buildAuthUser(data: BackendLoginResponse, role: FrontendRole): AuthUser {
  switch (role) {
    case "admin":
      return { role: "admin", username: data.username };

    case "staff":
      if (data.staff_id === undefined) {
        throw new AuthError(502, "Backend returned staff user without staff_id");
      }
      return {
        role: "staff",
        username: data.username,
        staffId: data.staff_id,
        mustChangePassword: data.must_change_password ?? false,
      };

    case "restaurant":
      if (data.restaurant_id === undefined) {
        throw new AuthError(502, "Backend returned restaurant user without restaurant_id");
      }
      return {
        role: "restaurant",
        username: data.username,
        restaurantId: data.restaurant_id,
      };
  }
}

/**
 * Get the appropriate redirect path after successful login.
 * Staff with mustChangePassword are redirected to settings first.
 */
export function getRedirectPath(user: AuthUser): string {
  // Staff must change password before accessing dashboard
  if (user.role === "staff" && user.mustChangePassword) {
    return "/staff/settings";
  }
  return ROLE_DASHBOARDS[user.role];
}
