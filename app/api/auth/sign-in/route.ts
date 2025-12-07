import { NextResponse } from "next/server";
import {
  parseSignInRequest,
  authenticateUser,
  getRedirectPath,
  setAuthCookies,
  AuthError,
  type SignInResponse,
} from "@/lib/auth";

/**
 * POST /api/auth/sign-in
 * Unified sign-in endpoint for all user types (admin, staff, restaurant)
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate request
    const parsed = parseSignInRequest(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.message },
        { status: 400 }
      );
    }

    const { username, password, requiredRole } = parsed.data;

    // Authenticate against backend
    const { user } = await authenticateUser(username, password, requiredRole);

    // Build response
    const response: SignInResponse = {
      success: true,
      user,
      redirect: getRedirectPath(user),
    };

    const res = NextResponse.json(response);
    setAuthCookies(res, user);

    return res;
  } catch (error) {
    // Handle known auth errors
    if (error instanceof AuthError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode }
      );
    }

    // Handle unexpected errors
    console.error("Sign-in error:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
