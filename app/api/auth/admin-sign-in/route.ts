import { NextResponse } from "next/server";

/**
 * =============================================================================
 * TODO: CONNECT TO EXPRESS BACKEND
 * =============================================================================
 *
 * CURRENT STATE: Uses hardcoded credentials (admin/Password1)
 * TARGET STATE: Call Express backend at POST /api/auth/login
 *
 * BACKEND ENDPOINT:
 *   URL: ${process.env.NEXT_PUBLIC_API_URL}/api/auth/login
 *   Method: POST
 *   Content-Type: application/json
 *
 * REQUEST BODY:
 *   { "username": "admin", "password": string }
 *
 * SUCCESS RESPONSE (200):
 *   {
 *     "message": "Login successful",
 *     "role": "ADMIN",
 *     "username": "admin"
 *   }
 *
 * ERROR RESPONSE (401):
 *   { "error": "Invalid credentials" }
 *
 * EXAMPLE IMPLEMENTATION:
 *   const API_URL = process.env.NEXT_PUBLIC_API_URL;
 *   const res = await fetch(`${API_URL}/api/auth/login`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ username, password }),
 *   });
 *   const data = await res.json();
 *   if (!res.ok || data.role !== 'ADMIN') {
 *     return NextResponse.json({ success: false, message: 'Invalid admin credentials' }, { status: 401 });
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
    // Verify role === 'ADMIN' in the response
    const ok = username === "admin" && password === "Password1";
    if (!ok) return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });

    return NextResponse.json({ success: true, role: "admin" as const });
  } catch (e) {
    return NextResponse.json({ success: false, message: e instanceof Error ? e.message : "Sign-in failed" }, { status: 500 });
  }
}
