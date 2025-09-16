// Authentication utility functions for demo purposes
// TODO: BACKEND TEAM - Replace entire file with BetterAuth client utilities

/**
 * Demo logout function - clears demo cookies
 * TODO: BACKEND TEAM - Replace with BetterAuth logout:
 *
 * import { authClient } from "@/lib/auth-client"
 * await authClient.signOut()
 *
 * BetterAuth will automatically:
 * - Invalidate the session in the database
 * - Clear httpOnly cookies
 * - Handle cleanup securely
 */
export function demoLogout() {
  // Clear demo cookies by setting them to expire immediately
  document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  document.cookie = 'username=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'

  // Redirect to login
  window.location.href = '/login'
}

/**
 * Check if user is authenticated (demo version)
 * TODO: BACKEND TEAM - Replace with BetterAuth session check:
 *
 * import { authClient } from "@/lib/auth-client"
 * const session = await authClient.getSession()
 * return !!session?.user
 */
export function isDemoAuthenticated(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.includes('authToken=demo-token')
}

/**
 * Get current user role (demo version)
 * TODO: BACKEND TEAM - Replace with BetterAuth session data:
 *
 * const session = await authClient.getSession()
 * return session?.user.role
 */
export function getDemoUserRole(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/userRole=([^;]+)/)
  return match ? match[1] : null
}