import { redirect } from 'next/navigation'

/**
 * Temporary redirect: keep legacy /staff/login URL working
 * by redirecting to the unified /login page.
 */
export default function StaffLoginRedirect() {
  redirect('/login')
}