'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { API_URL } from '@/lib/auth'

function levenshtein(a: string, b: string) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  return dp[m][n]
}
function tooSimilar(currentRaw: string, nextRaw: string): boolean {
  const c = currentRaw.trim().toLowerCase(), n = nextRaw.trim().toLowerCase()
  if (!c || !n) return false
  if (c === n) return true
  if ((c.length >= 4 && n.includes(c)) || (n.length >= 4 && c.includes(n))) return true
  const dist = levenshtein(c, n), maxLen = Math.max(c.length, n.length)
  return 1 - dist / Math.max(1, maxLen) >= 0.8
}
function meetsComplexity(pwd: string): boolean {
  const s = pwd
  const hasUpper = /[A-Z]/.test(s)
  const hasLower = /[a-z]/.test(s)
  const hasDigit = /[0-9]/.test(s)
  const hasSymbol = /[^A-Za-z0-9]/.test(s)
  const kinds = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length
  return s.length >= 8 && kinds >= 3
}
function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" aria-label={label} onClick={onClick} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" title="Clear">
      ✕
    </button>
  )
}

export default function StaffSettingsPage() {
  const { user, refresh } = useAuth()
  const username = user?.username ?? 'staff'

  const [currentPwd, setCurrentPwd] = React.useState('')
  const [newPwd, setNewPwd] = React.useState('')
  const [confirmPwd, setConfirmPwd] = React.useState('')
  const [pwdSuccess, setPwdSuccess] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  async function onUpdatePassword() {
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) return toast.error('All fields are required.')
    if (newPwd !== confirmPwd) return toast.error("New password and confirmation don't match.")
    if (tooSimilar(currentPwd, newPwd)) return toast.warning('New password is too similar to the current password.')
    if (!meetsComplexity(newPwd)) return toast.warning('Use at least 8 characters and a mix of letters, numbers, and symbols.')

    setIsSubmitting(true)
    try {
      // Call backend to change password
      const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          oldPassword: currentPwd,
          newPassword: newPwd,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to change password')
        return
      }

      // Clear the mustChangePassword cookie
      await fetch('/api/auth/clear-password-flag', { method: 'POST' })

      // Refresh auth state to update mustChangePassword
      await refresh()

      setPwdSuccess(true)
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('')
    } catch (err) {
      toast.error('Failed to connect to server')
      console.error('Password change error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 mx-auto max-w-xl">
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="text-sm font-medium mb-3">My Profile</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Username</span>
            <span className="font-medium">{username}</span>
          </div>
        </div>
      </div>
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="text-sm font-medium mb-3">Change Password</h3>
        <div className="grid gap-3 sm:max-w-lg">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Current password</span>
            <div className="relative">
              <input type="password" className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2" value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} placeholder="Enter current password" />
              {currentPwd && <ClearButton onClick={() => setCurrentPwd('')} label="Clear current password" />}
            </div>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">New password</span>
            <div className="relative">
              <input type="password" className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Enter new password" />
              {newPwd && <ClearButton onClick={() => setNewPwd('')} label="Clear new password" />}
            </div>
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Confirm new password</span>
            <div className="relative">
              <input type="password" className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} placeholder="Re-enter new password" />
              {confirmPwd && <ClearButton onClick={() => setConfirmPwd('')} label="Clear confirmation password" />}
            </div>
          </label>
          <div className="pt-1">
            <Button size="sm" onClick={onUpdatePassword} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update password'}
            </Button>
          </div>
        </div>
        {/* Success modal */}
        {pwdSuccess && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
            <div className="w-full max-w-md rounded-lg border bg-background shadow-lg">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h2 className="text-sm font-medium">Password Updated</h2>
                <button className="rounded p-1 hover:bg-muted" onClick={() => setPwdSuccess(false)} aria-label="Close">✕</button>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>Your password has been updated successfully.</div>
                <div className="pt-1">
                  <Button size="sm" className="w-full" onClick={() => setPwdSuccess(false)}>Close</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}