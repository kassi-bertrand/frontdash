/**
 * Middleware: Protect /admin/* and /staff/* using unified /login.
 *
 * Behavior:
 * - Public: /login (always allowed)
 * - Protected: /admin/* and /staff/*
 *   - If no auth cookie -> redirect to /login
 *   - If wrong role for section -> redirect to /login
 *
 * Cookies (set by /api/auth/sign-in):
 * - authToken: any non-empty value means authenticated
 * - userRole: 'admin' | 'staff'
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow unified login through without checks
  if (pathname === '/login') {
    return NextResponse.next()
  }

  // Determine protected sections
  const isAdminRoute = pathname.startsWith('/admin')
  const isStaffRoute = pathname.startsWith('/staff')
  const isProtectedRoute = isAdminRoute || isStaffRoute

  if (isProtectedRoute) {
    const authToken = request.cookies.get('authToken')?.value
    const userRole = request.cookies.get('userRole')?.value // 'admin' | 'staff' | undefined

    // Not authenticated -> send to /login
    if (!authToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Authenticated but wrong role for the section -> send to /login
    if (isAdminRoute && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    if (isStaffRoute && userRole !== 'staff') {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Allow everything else
  return NextResponse.next()
}

/**
 * Run on all non-API routes and non-static assets.
 * We explicitly allow /login above.
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}