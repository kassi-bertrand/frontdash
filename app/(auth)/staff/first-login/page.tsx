/**
 * Staff First-Login (Temporary)
 * - Redirects to /staff/settings so password can be changed first.
 * - Safe to delete later if unused.
 */
import { redirect } from 'next/navigation'

export default function StaffFirstLoginTemp() {
  redirect('/staff/settings')
}