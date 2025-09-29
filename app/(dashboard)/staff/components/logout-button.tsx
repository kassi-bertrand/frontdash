'use client'

/**
 * Reusable Logout Button:
 * - Shows a "Logging out..." toast for `durationMs` (default 2000 ms).
 * - Optionally calls `onBeforeRedirect` (e.g., signOut API) before redirecting.
 * - Redirects to `redirectTo` after the delay.
 *
 * Usage:
 * <LogoutButton
 *   redirectTo="/auth/login"
 *   onBeforeRedirect={async () => { await fetch('/api/auth/logout', { method: 'POST' }) }}
 * />
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { IconLogout } from '@tabler/icons-react'

type LogoutButtonProps = {
  // Destination after logout. Change to your actual login route.
  redirectTo?: string
  // Optional: do any cleanup or server sign-out before redirecting.
  onBeforeRedirect?: () => Promise<void> | void
  // How long to show the toast before redirect (milliseconds).
  durationMs?: number
  // Button label text.
  label?: string
  // Extra className forwarded to the Button.
  className?: string
}

export function LogoutButton({
  redirectTo = '/login',
  onBeforeRedirect,
  durationMs = 2000,
  label = 'Log out',
  className,
}: LogoutButtonProps) {
  const router = useRouter()
  const [busy, setBusy] = React.useState(false)

  const onClick = async () => {
    if (busy) return
    setBusy(true)

    // Show non-blocking toast while we "log out"
    toast.info('Logging out...', { duration: durationMs })

    try {
      if (onBeforeRedirect) {
        await onBeforeRedirect()
      }
    } finally {
      // After the toast duration, navigate to the login page
      setTimeout(() => {
        router.push(redirectTo)
      }, durationMs)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      onClick={onClick}
      disabled={busy}
    >
      <IconLogout className="mr-2 h-4 w-4" />
      {label}
    </Button>
  )
}