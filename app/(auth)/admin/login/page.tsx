import { redirect } from 'next/navigation'

/**
 * Legacy Admin Login URL
 * - Redirect to the unified /login page.
 * - Safe to delete once all links point to /login.
 */
export default function AdminLoginRedirect() {
  redirect('/login')
}