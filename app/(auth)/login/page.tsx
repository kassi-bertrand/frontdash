'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ApiResponse = { success: boolean; role?: 'admin' | 'staff'; message?: string }

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const u = username.trim()
    const p = password
    if (!u || !p) {
      setError('Enter username and password.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password: p }),
      })
      const data: ApiResponse = await res.json().catch(() => ({ success: false }))
      if (!res.ok || !data.success || !data.role) {
        setError(data.message || 'Invalid credentials')
        return
      }

      // Minimal local context used elsewhere (headers/profile)
      localStorage.setItem('fd_username', u)
      localStorage.setItem('fd_email', `${u}@frontdash.app`)
      localStorage.setItem('fd_role', data.role)

      // First-time password change for staff
      if (data.role === 'staff' && !localStorage.getItem('fd_pwd_changed')) {
        localStorage.setItem('fd_must_change_pwd', '1')
      }

      // Redirect by role
      router.replace(data.role === 'admin' ? '/admin/dashboard' : '/staff')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-gradient-to-br from-muted/40 to-background md:grid-cols-2">
      {/* Brand / Visual side (hidden on small) */}
      <div className="relative hidden items-center justify-center p-8 md:flex">
        <div className="absolute inset-6 rounded-3xl bg-muted/40" />
        <div className="relative z-10 max-w-md">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            FD
          </div>
          <h2 className="text-2xl font-semibold">Welcome to FrontDash</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to manage orders, staff, and drivers efficiently.
          </p>
        </div>
      </div>

      {/* Form side */}
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h1 className="text-xl font-semibold">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your FrontDash account to continue.
            </p>
          </div>

          <form onSubmit={onSubmit} className="rounded-xl border bg-background p-5 shadow-sm">
            <div className="grid gap-3">
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Username</span>
                <input
                  className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Password</span>
                <input
                  type="password"
                  className="h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                />
              </label>
              {error && <div className="text-sm text-rose-600">{error}</div>}
              <div className="pt-1">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </div>
            </div>
          </form>

          {/* Optional footer */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} FrontDash</span>
          </div>
        </div>
      </main>
    </div>
  )
}