import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIES } from "@/lib/auth";

/**
 * POST /api/auth/clear-password-flag
 *
 * Clears the mustChangePassword cookie after successful password change.
 * Called by the staff settings page after the backend confirms the change.
 */
export async function POST() {
  const cookieStore = await cookies();

  // Verify user is authenticated as staff
  const role = cookieStore.get(AUTH_COOKIES.ROLE)?.value;
  if (role !== "staff") {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  // Clear the must change password flag
  const res = NextResponse.json({ success: true });
  res.cookies.delete({ name: AUTH_COOKIES.MUST_CHANGE_PWD, path: "/" });

  return res;
}
