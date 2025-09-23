/**
 * Next.js Middleware - Route Protection
 *
 * What is middleware?
 * - A function that runs BEFORE a request is completed
 * - Executes on Vercel's Edge Runtime (lightweight, fast JavaScript runtime)
 * - Runs on EVERY request that matches the matcher configuration
 *
 * When does it run?
 * Timeline: User clicks link → Middleware runs → Page renders
 *                                    ↓
 *                             Can redirect/block
 *
 * - Runs BEFORE any page rendering or API routes
 * - Runs on the server edge (not in the browser)
 * - Perfect for authentication checks, redirects, header modifications
 *
 * Why use middleware for auth instead of useEffect?
 * - Runs before page loads (no flash of protected content)
 * - Works with server-side rendering
 * - Can't be bypassed by disabling JavaScript
 * - More secure and performant
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isStaffRoute = request.nextUrl.pathname.startsWith('/staff')
  const isProtectedRoute = isAdminRoute || isStaffRoute

  // Only check auth for protected routes
  if (isProtectedRoute) {
    // TODO: Replace with BetterAuth session validation when backend is ready
    // With BetterAuth, this would look like:
    // const session = await auth.getSession(request)
    // if (!session?.user) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
    // if (isAdminRoute && session.user.role !== 'admin') {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }

    // Temporary demo authentication check
    // In production, auth tokens should be stored in httpOnly cookies, not
    // localStorage
    // Middleware can only read cookies, not localStorage (which is client-side only)
    const authToken = request.cookies.get('authToken')?.value
    const userRole = request.cookies.get('userRole')?.value

    if (!authToken) {
      // No authentication token found - redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (isAdminRoute && userRole !== 'admin') {
      // User trying to access admin routes without admin role
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    // Run on all routes except:
    // - API routes (/api/*)
    // - Static files (_next/static/*)
    // - Images (_next/image/*)
    // - Favicon
    // - Login page (to avoid redirect loops)
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
}
