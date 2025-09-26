'use client'

/**
 * Admin • Settings — Update Password
 *
 * Validations (toasts):
 * - Any field left blank -> error toast
 * - Current password too similar to new -> warning toast
 * - New password doesn't match confirmation -> error toast
 * - Minimum complexity: 8+ chars, at least 3 of [upper, lower, digit, symbol] -> warning toast
 * Success:
 * - Shows a modal confirming password has been updated
 */

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-medium">{title}</h3>
      {children}
    </div>
  )
}

function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full ${maxWidth} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            className="rounded p-1 hover:bg-muted"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

// Simple Levenshtein distance for similarity checks
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,      // deletion
        dp[i][j - 1] + 1,      // insertion
        dp[i - 1][j - 1] + cost // substitution
      )
    }
  }
  return dp[m][n]
}

function tooSimilar(currentRaw: string, nextRaw: string): boolean {
  const current = currentRaw.trim().toLowerCase()
  const next = nextRaw.trim().toLowerCase()
  if (!current || !next) return false
  if (current === next) return true
  if (
    (current.length >= 4 && next.includes(current)) ||
    (next.length >= 4 && current.includes(next))
  ) return true
  const dist = levenshtein(current, next)
  const maxLen = Math.max(current.length, next.length)
  const similarity = 1 - dist / Math.max(1, maxLen)
  return similarity >= 0.8
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
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
      title="Clear"
    >
      ✕
    </button>
  )
}

export default function SettingsPage() {
  const [currentPwd, setCurrentPwd] = React.useState('')
  const [newPwd, setNewPwd] = React.useState('')
  const [confirmPwd, setConfirmPwd] = React.useState('')
  const [successOpen, setSuccessOpen] = React.useState(false)

  function onUpdatePassword() {
    // Blank checks
    if (!currentPwd.trim() || !newPwd.trim() || !confirmPwd.trim()) {
      toast.error('All fields are required.')
      return
    }
    // Match check
    if (newPwd !== confirmPwd) {
      toast.error("New password and confirmation don't match.")
      return
    }
    // Similarity check
    if (tooSimilar(currentPwd, newPwd)) {
      toast.warning('New password is too similar to the current password.')
      return
    }
    // Complexity check (min length + variety)
    if (!meetsComplexity(newPwd)) {
      toast.warning('Use at least 8 characters and a mix of letters, numbers, and symbols.')
      return
    }

    // Success — wire to API here
    setSuccessOpen(true)
    setCurrentPwd('')
    setNewPwd('')
    setConfirmPwd('')
  }

  return (
    <div className="space-y-6">
      <Card title="Update Password">
        <div className="grid gap-3 sm:max-w-lg">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Current password</span>
            <div className="relative">
              <input
                type="password"
                className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
              />
              {currentPwd && (
                <ClearButton onClick={() => setCurrentPwd('')} label="Clear current password" />
              )}
            </div>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">New password</span>
            <div className="relative">
              <input
                type="password"
                className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="Enter new password"
              />
              {newPwd && (
                <ClearButton onClick={() => setNewPwd('')} label="Clear new password" />
              )}
            </div>
          </label>

          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Confirm new password</span>
            <div className="relative">
              <input
                type="password"
                className="h-9 w-full rounded-md border px-3 pr-8 text-sm outline-none focus-visible:ring-2"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Re-enter new password"
              />
              {confirmPwd && (
                <ClearButton onClick={() => setConfirmPwd('')} label="Clear confirmation password" />
              )}
            </div>
          </label>

          <div className="pt-1">
            <Button size="sm" onClick={onUpdatePassword}>
              Update password
            </Button>
          </div>
        </div>
      </Card>

      <Modal open={successOpen} onClose={() => setSuccessOpen(false)} title="Password Updated">
        <div className="space-y-3 text-sm">
          <div>Your password has been updated successfully.</div>
          <div className="text-muted-foreground">
            Tip: Use a strong password you don’t reuse elsewhere.
          </div>
          <div className="pt-1">
            <Button size="sm" className="w-full" onClick={() => setSuccessOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}