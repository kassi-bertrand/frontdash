import { NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/auth";

/**
 * POST /api/logout
 * Clears all auth cookies and ends the session
 */
export async function POST() {
  const res = NextResponse.json({ success: true, message: "Logged out successfully" });
  clearAuthCookies(res);
  return res;
}
