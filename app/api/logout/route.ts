import { NextResponse } from "next/server";

/**
 * =============================================================================
 * TODO: CONNECT TO EXPRESS BACKEND & CLEAR ALL COOKIES
 * =============================================================================
 *
 * CURRENT STATE: Only clears fd_role cookie
 * TARGET STATE: Call backend logout and clear ALL auth-related cookies
 *
 * BACKEND ENDPOINT:
 *   URL: ${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout
 *   Method: POST
 *   Response: { "success": true, "message": "Logged out successfully..." }
 *
 * COOKIES TO CLEAR:
 *   - fd_role (current)
 *   - authToken
 *   - userRole
 *   - username
 *   - fd_restaurant_id (for restaurant users)
 *
 * EXAMPLE IMPLEMENTATION:
 *   export async function POST() {
 *     // Optional: notify backend (for session invalidation if implemented)
 *     const API_URL = process.env.NEXT_PUBLIC_API_URL;
 *     try {
 *       await fetch(`${API_URL}/api/auth/logout`, { method: 'POST' });
 *     } catch {
 *       // Backend logout is optional; continue clearing cookies
 *     }
 *
 *     const res = NextResponse.json({ success: true });
 *
 *     // Clear all auth-related cookies
 *     const cookiesToClear = ['fd_role', 'authToken', 'userRole', 'username', 'fd_restaurant_id'];
 *     for (const name of cookiesToClear) {
 *       res.cookies.delete({ name, path: '/' });
 *     }
 *
 *     return res;
 *   }
 *
 * NOTES:
 *   - Current backend logout is stateless (just returns success message)
 *   - If JWT tokens are added later, backend may need to invalidate them
 *   - Client should also clear localStorage items (fd_pwd_changed, etc.)
 * =============================================================================
 */

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete({ name: "fd_role", path: "/" });
  return res;
}