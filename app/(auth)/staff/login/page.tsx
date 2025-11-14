/**
 * Legacy Staff Login URL
 * - Keep this file temporarily to avoid broken links.
 * - Immediately redirect to the unified /login page.
 * - Safe to delete later once all links point to /login.
 */
import { redirect } from 'next/navigation'

export default function StaffLoginRedirect() {
  redirect('/login')
}