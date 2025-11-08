import { NextResponse } from 'next/server'

export async function POST() {
  // Clear auth cookies (adjust names as needed)
  const res = new NextResponse(null, { status: 204 })
  res.cookies.set('authToken', '', { path: '/', expires: new Date(0) })
  res.cookies.set('userRole',  '', { path: '/', expires: new Date(0) })
  return res
}

// Optional: allow GET to also clear cookies
export const GET = POST