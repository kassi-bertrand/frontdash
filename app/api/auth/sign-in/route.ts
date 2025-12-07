import { NextResponse } from "next/server";

/**
 * =============================================================================
 * TODO: CONNECT TO EXPRESS BACKEND
 * =============================================================================
 *
 * CURRENT STATE: Uses hardcoded credentials (admin/Password1, staff/Temp1234)
 * TARGET STATE: Call Express backend at POST /api/auth/login
 *
 * BACKEND ENDPOINT:
 *   URL: ${process.env.NEXT_PUBLIC_API_URL}/api/auth/login
 *   Method: POST
 *   Content-Type: application/json
 *
 * REQUEST BODY:
 *   {
 *     "username": string,  // e.g., "admin" or "smith42"
 *     "password": string   // e.g., "Password1"
 *   }
 *
 * SUCCESS RESPONSE (200):
 *   {
 *     "message": "Login successful",
 *     "role": "ADMIN" | "STAFF" | "RESTAURANT",
 *     "username": string,
 *     "must_change_password": boolean,  // true if first login for staff
 *     "staff_id": number | undefined,   // only for staff
 *     "restaurant_id": number | undefined  // only for restaurant
 *   }
 *
 * ERROR RESPONSE (401):
 *   { "error": "Invalid credentials" }
 *
 * EXAMPLE IMPLEMENTATION:
 *   import { authApi } from '@/lib/api';
 *
 *   const result = await authApi.login({ username, password });
 *   // result.role will be "ADMIN", "STAFF", or "RESTAURANT"
 *   // Map to lowercase for frontend compatibility: result.role.toLowerCase()
 *
 * NOTES:
 *   - Backend returns uppercase roles (ADMIN, STAFF, RESTAURANT)
 *   - Frontend expects lowercase (admin, staff, restaurant)
 *   - Check must_change_password for staff first-login enforcement
 * =============================================================================
 */

type SignInBody = { username?: string; email?: string; password?: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as SignInBody;
    const username = (body.username || body.email || "").trim().toLowerCase();
    const password = body.password || "";

    // TODO: Replace this hardcoded credential check with backend API call
    // Example:
    // const API_URL = process.env.NEXT_PUBLIC_API_URL;
    // const backendRes = await fetch(`${API_URL}/api/auth/login`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ username, password }),
    // });
    // const data = await backendRes.json();
    // if (!backendRes.ok) {
    //   return NextResponse.json({ success: false, message: data.error }, { status: 401 });
    // }
    // const role = data.role.toLowerCase() as "admin" | "staff";

    let role: "admin" | "staff" | null = null;
    if (username === "admin" && password === "Password1") role = "admin";
    else if (username === "staff" && password === "Temp1234") role = "staff";

    if (!role) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    const redirect = role === "admin" ? "/admin/dashboard" : "/staff";
    const user = { role, username, email: `${username}@frontdash.app`, name: role === "admin" ? "Admin User" : "Staff User" };
    const token = `demo-${role}-token`;

    const res = NextResponse.json({ success: true, role, user, token, redirect });
    // Client-visible cookie for demo middleware/guards (BetterAuth will use httpOnly)
    res.cookies.set("fd_role", role, { path: "/", httpOnly: false });
    return res;
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Sign-in failed" }, { status: 500 });
  }
}
