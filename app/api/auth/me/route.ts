import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth/cookies";
import { parseFrontendRole, type AuthUser } from "@/lib/auth/types";

/**
 * GET /api/auth/me
 *
 * Returns the current authenticated user from httpOnly cookies.
 * Used by client-side components to get auth state without accessing
 * cookies directly (which they can't, since cookies are httpOnly).
 *
 * @returns { user: AuthUser } if authenticated with valid cookies
 * @returns { user: null } if not authenticated or cookies are corrupted
 */
export async function GET() {
  const cookieStore = await cookies();

  // Validate role cookie (don't trust raw string)
  const role = parseFrontendRole(cookieStore.get(AUTH_COOKIES.ROLE)?.value);
  const username = cookieStore.get(AUTH_COOKIES.USERNAME)?.value;

  // Not authenticated or invalid role
  if (!role || !username) {
    return NextResponse.json({ user: null });
  }

  // Build user object based on role
  let user: AuthUser;

  switch (role) {
    case "admin":
      user = { role: "admin", username };
      break;

    case "staff": {
      const staffIdStr = cookieStore.get(AUTH_COOKIES.STAFF_ID)?.value;
      const staffId = staffIdStr ? parseInt(staffIdStr, 10) : NaN;
      // Corrupted staff_id - treat as unauthenticated
      if (Number.isNaN(staffId)) {
        return NextResponse.json({ user: null });
      }
      const mustChangePassword = cookieStore.get(AUTH_COOKIES.MUST_CHANGE_PWD)?.value === "1";
      user = { role: "staff", username, staffId, mustChangePassword };
      break;
    }

    case "restaurant": {
      const restaurantIdStr = cookieStore.get(AUTH_COOKIES.RESTAURANT_ID)?.value;
      const restaurantId = restaurantIdStr ? parseInt(restaurantIdStr, 10) : NaN;
      // Corrupted restaurant_id - treat as unauthenticated
      if (Number.isNaN(restaurantId)) {
        return NextResponse.json({ user: null });
      }
      user = { role: "restaurant", username, restaurantId };
      break;
    }
  }

  return NextResponse.json({ user });
}
