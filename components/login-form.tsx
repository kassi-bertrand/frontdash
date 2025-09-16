"use client"

import { useState } from "react"
// Using useRouter from 'next/navigation' for programmatic navigation
// Why next/navigation and not next/router?
// 1. We're using Next.js App Router (not Pages Router)
// 2. next/router is deprecated in Next.js 15+
// 3. next/navigation is the official App Router navigation API
//
// Why useRouter and not <Link> component?
// - <Link> is for user-initiated navigation (clicking links)
// - useRouter is for programmatic navigation (after form submission, API calls, etc.)
// - Our use case: redirect after successful login authentication
import { useRouter } from "next/navigation"
import { Building } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // TODO: BACKEND TEAM - Replace with BetterAuth authentication
    // The "hard-coded administrator account" requirement means the backend
    // database should be seeded with a default admin user, not that we put
    // credentials in the frontend code.
    //
    // When BetterAuth is implemented, this will become:
    // const { data, error } = await authClient.signIn.email({
    //   email: username, // or email field
    //   password: password,
    // })
    //
    // if (error) {
    //   alert(error.message)
    //   return
    // }
    //
    // // BetterAuth automatically handles:
    // // - Session creation with httpOnly cookies
    // // - User role management
    // // - Secure token generation
    // // - Automatic redirects based on user.role
    //
    // if (data.user.role === 'admin') {
    //   router.push('/admin/dashboard')
    // } else {
    //   router.push('/staff/dashboard')
    // }

    // Temporary demo behavior - remove when backend is ready
    setTimeout(() => {
      if (username && password) {
        const userRole = username.toLowerCase().includes('admin') ? 'admin' : 'staff'

        // TODO: BACKEND TEAM - Remove this entire cookie-setting block
        // BetterAuth will automatically set httpOnly cookies on the SERVER
        // via the auth handler at /api/auth/[...all]/route.ts
        // Session duration will be configured in the BetterAuth config (24 hours)
        //
        // These demo cookies are TEMPORARY and INSECURE (accessible to JavaScript)
        // They exist only to test the middleware functionality
        document.cookie = `authToken=demo-token; path=/; max-age=3600` // 1 hour demo
        document.cookie = `userRole=${userRole}; path=/; max-age=3600`
        document.cookie = `username=${username}; path=/; max-age=3600`

        // Client-side navigation after successful "login"
        router.push('/admin/dashboard')
      } else {
        alert("Please enter both username and password")
      }
      setIsLoading(false)
    }, 1000)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building className="size-6" />
              </div>
              <span className="sr-only">FrontDash</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to FrontDash</h1>
            <div className="text-center text-sm text-muted-foreground">
              Sign in to access your dashboard
            </div>
          </div>
          <div className="flex flex-col gap-6">
            <div className="grid gap-3">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </div>
        </div>
      </form>
      <div className="text-muted-foreground text-center text-xs text-balance">
        FrontDash Portal - Authorized personnel only
      </div>
    </div>
  )
}