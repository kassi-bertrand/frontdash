import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const url = new URL(request.url)
  const redirectTo = url.searchParams.get('redirect') || '/login'

  // Build 303 redirect so the browser uses GET on the next hop
  const res = NextResponse.redirect(new URL(redirectTo, url), 303)

  // Clear auth cookies (adjust names as needed)
  res.cookies.set('authToken', '', { path: '/', expires: new Date(0) })
  res.cookies.set('userRole', '', { path: '/', expires: new Date(0) })

  return res
}

// Optional: support GET as well
export const GET = POST