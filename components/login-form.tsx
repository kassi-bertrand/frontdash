'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, UtensilsCrossed } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type LoginVariant = 'staff' | 'restaurant'

type LoginFormProps = React.ComponentProps<'div'> & {
  variant: LoginVariant
}

export function LoginForm({ className, variant, ...props }: LoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isRestaurant = variant === 'restaurant'
  const title = isRestaurant ? 'Restaurant portal' : 'Welcome to FrontDash'
  const description = isRestaurant
    ? 'Use the shared credentials you received after approval to manage your restaurant.'
    : 'Sign in to access your admin or staff dashboard.'
  const submitLabel = isRestaurant ? 'Sign in as restaurant' : 'Sign in'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    try {
      if (isRestaurant) {
        // Keep restaurant demo behavior (no backend yet)
        if (!username || !password) {
          alert('Please enter both username and password')
          return
        }
        // Demo cookies for middleware tests (insecure; client-accessible)
        document.cookie = `authToken=demo-restaurant-token; path=/; max-age=3600`
        document.cookie = `userRole=restaurant; path=/; max-age=3600`
        document.cookie = `fd_role=restaurant; path=/; max-age=3600`
        router.replace('/restaurant/dashboard')
        return
      }

      // Admin/Staff: call backend stub which returns { success, role, redirect? }
      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean
        role?: 'admin' | 'staff'
        user?: { role?: 'admin' | 'staff'; email?: string; username?: string; name?: string }
        token?: string
        redirect?: string
        message?: string
      }

      if (!res.ok || !data?.success || !data?.role) {
        alert(data?.message || 'Invalid credentials')
        return
      }

      // Set role cookies for middleware/guards (demo; BetterAuth will replace later)
      document.cookie = `fd_role=${data.role}; path=/; max-age=3600`
      document.cookie = `userRole=${data.role}; path=/; max-age=3600`
      if (data.user?.username) {
        document.cookie = `username=${data.user.username}; path=/; max-age=3600`
      }

      // Choose destination: prefer API redirect, else by role
      const dest = data.redirect ?? (data.role === 'admin' ? '/admin/dashboard' : '/staff')
      router.replace(dest)
    } catch (err: any) {
      alert(err?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a href="#" className="flex flex-col items-center gap-2 font-medium">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                {isRestaurant ? <UtensilsCrossed className="size-6" /> : <Building className="size-6" />}
              </div>
              <span className="sr-only">FrontDash</span>
            </a>
            <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
            <div className="text-center text-sm text-muted-foreground">{description}</div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor={`username-${variant}`}>{isRestaurant ? 'Restaurant username' : 'Username'}</Label>
              <Input
                id={`username-${variant}`}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor={`password-${variant}`}>Password</Label>
              <Input
                id={`password-${variant}`}
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in…' : submitLabel}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        {isRestaurant
          ? 'Need help? Contact FrontDash support to reset your shared credentials.'
          : 'FrontDash portal – authorized personnel only.'}
      </div>
    </div>
  )
}