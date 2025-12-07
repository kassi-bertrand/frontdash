'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building, UtensilsCrossed } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SignInResponse, AuthErrorResponse, FrontendRole } from '@/lib/auth'

export type LoginVariant = 'staff' | 'restaurant'

type LoginFormProps = React.ComponentProps<'div'> & {
  variant: LoginVariant
}

export function LoginForm({ className, variant, ...props }: LoginFormProps) {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRestaurant = variant === 'restaurant'
  const title = isRestaurant ? 'Restaurant portal' : 'Welcome to FrontDash'
  const description = isRestaurant
    ? 'Use the shared credentials you received after approval to manage your restaurant.'
    : 'Sign in to access your admin or staff dashboard.'
  const submitLabel = isRestaurant ? 'Sign in as restaurant' : 'Sign in'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (!username || !password) {
        setError('Please enter both username and password')
        return
      }

      // All logins go through the unified sign-in endpoint
      const requiredRole: FrontendRole | undefined = isRestaurant ? 'restaurant' : undefined

      const res = await fetch('/api/auth/sign-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, requiredRole }),
      })

      const data: SignInResponse | AuthErrorResponse = await res.json()

      if (!res.ok || !data.success) {
        setError(data.message || 'Invalid credentials')
        return
      }

      // Navigate to the redirect path from the response
      router.replace(data.redirect)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
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
              <Label htmlFor={`username-${variant}`}>
                {isRestaurant ? 'Restaurant username' : 'Username'}
              </Label>
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
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
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
