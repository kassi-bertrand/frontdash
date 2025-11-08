/**
 * Unified Sign-In API (/api/auth/sign-in)
 * - Accepts JSON: { username, password }
 * - Logic:
 *   - If credentials match hardcoded admin, authenticate as admin
 *   - Else if credentials match a staff user in the demo list, authenticate as staff
 *   - Else 401
 * - On success: sets HTTP-only cookies (authToken, userRole) and returns { success: true, role }
 *
 * Note: This is for Assignment 2 demo. Replace with DB + hashing later.
 */

import { NextResponse } from 'next/server'

// Hardcoded admin (single)
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'Password1'

// Demo staff accounts (add more if needed)
const STAFF_USERS = [
  { username: 'smith12', password: 'Password1' },
  { username: 'lee34',   password: 'Password1' },
]

export async function POST(request: Request) {
  const { username, password } = await request.json().catch(() => ({}))

  // Defensive validation (front-end also validates)
  if (!username || !password) {
    return NextResponse.json(
      { success: false, message: 'Missing username or password' },
      { status: 400 }
    )
  }

  // 1) Check admin first
  const isAdmin = username === ADMIN_USERNAME && password === ADMIN_PASSWORD
  if (isAdmin) {
    const res = NextResponse.json({ success: true, role: 'admin' as const })
    res.cookies.set('authToken', 'admin-demo-token', { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 })
    res.cookies.set('userRole', 'admin', { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 })
    return res
  }

  // 2) Check staff list
  const staff = STAFF_USERS.find(u => u.username === username && u.password === password)
  if (staff) {
    const res = NextResponse.json({ success: true, role: 'staff' as const })
    res.cookies.set('authToken', 'staff-demo-token', { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 })
    res.cookies.set('userRole', 'staff', { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 })
    return res
  }

  // 3) No match
  return NextResponse.json(
    { success: false, message: 'Invalid credentials' },
    { status: 401 }
  )
}