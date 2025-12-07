/**
 * Next.js Middleware - Route Protection
 *
 * Runs BEFORE every request to protected routes. Uses httpOnly cookies
 * set by the auth module to validate access.
 *
 * Flow: User clicks link → Middleware checks cookies → Allow or redirect
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIES } from '@/lib/auth/cookies'
import { ROLE_DASHBOARDS } from '@/lib/auth/config'
import { parseFrontendRole, type FrontendRole } from '@/lib/auth/types'

/** Route protection rules: which roles can access which paths */
const ROUTE_RULES: { prefix: string; allowedRoles: FrontendRole[] }[] = [
  { prefix: '/admin', allowedRoles: ['admin'] },
  { prefix: '/staff', allowedRoles: ['staff'] },
  { prefix: '/restaurant/dashboard', allowedRoles: ['restaurant'] },
]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Find matching route rule
  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix))
  if (!rule) {
    // Not a protected route - allow through
    return NextResponse.next()
  }

  // Read and validate auth cookies (set by lib/auth/cookies.ts)
  const role = parseFrontendRole(request.cookies.get(AUTH_COOKIES.ROLE)?.value)
  const username = request.cookies.get(AUTH_COOKIES.USERNAME)?.value

  // No auth cookies = not logged in
  if (!role || !username) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Check if user's role is allowed for this route
  if (!rule.allowedRoles.includes(role)) {
    // Logged in but wrong role - redirect to their dashboard
    const redirectPath = ROLE_DASHBOARDS[role] || '/login'
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Authorized - allow through
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
