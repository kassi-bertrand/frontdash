import { NextResponse } from "next/server";

/**
 * =============================================================================
 * TODO: CONNECT TO EXPRESS BACKEND
 * =============================================================================
 *
 * CURRENT STATE: Uses hardcoded credentials (staff/Temp1234)
 * TARGET STATE: Call Express backend at POST /api/auth/login
 *
 * BACKEND ENDPOINT:
 *   URL: ${process.env.NEXT_PUBLIC_API_URL}/api/auth/login
 *   Method: POST
 *   Content-Type: application/json
 *
 * REQUEST BODY:
 *   { "username": string, "password": string }
 *   Example: { "username": "smith42", "password": "StaffPass1" }
 *
 * SUCCESS RESPONSE (200):
 *   {
 *     "message": "Login successful",
 *     "role": "STAFF",
 *     "username": "smith42",
 *     "must_change_password": true,  // TRUE if first login
 *     "staff_id": 1
 *   }
 *
 * ERROR RESPONSE (401):
 *   { "error": "Invalid credentials" }
 *
 * IMPORTANT - FIRST LOGIN FLOW:
 *   If response.must_change_password === true:
 *   - Redirect to password change page
 *   - Don't allow access to dashboard until password changed
 *   - Call POST /api/auth/change-password after new password entered
 *
 * EXAMPLE IMPLEMENTATION:
 *   const API_URL = process.env.NEXT_PUBLIC_API_URL;
 *   const res = await fetch(`${API_URL}/api/auth/login`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ username, password }),
 *   });
 *   const data = await res.json();
 *   if (!res.ok || data.role !== 'STAFF') {
 *     return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
 *   }
 *   // Check first login
 *   if (data.must_change_password) {
 *     return NextResponse.json({ success: true, role: 'staff', redirect: '/staff/settings', mustChangePassword: true });
 *   }
 * =============================================================================
 */

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    // TODO: Replace hardcoded check with backend API call
    // Check must_change_password in response for first-login enforcement
    const ok = (username === "staff" || username === "staff@frontdash.app" || username === "staff@example.com") && password === "Temp1234";
    if (!ok) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    const role = "staff" as const;
    const user = {
      role,
      username,
      email: username.includes("@") ? username : `${username}@frontdash.app`,
      name: "Staff User",
    };
    const token = "demo-staff-token";
    const redirect = "/staff";

    const res = NextResponse.json({ success: true, role, user, token, redirect });
    res.cookies.set("fd_role", role, { path: "/", httpOnly: false });

    return res;
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Sign-in failed" }, { status: 500 });
  }
}
