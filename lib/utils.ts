import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a user-friendly error message from an unknown error.
 *
 * Use this in catch blocks to safely get a string message regardless
 * of what was thrown (Error, string, object with message, or something else).
 *
 * @param err - The caught error (could be Error, string, or anything)
 * @param fallback - Message to show if we can't extract one
 * @returns A string error message suitable for displaying to users
 *
 * @example
 * ```ts
 * try {
 *   await fetchData()
 * } catch (err) {
 *   setError(getErrorMessage(err, "Failed to load data"))
 * }
 * ```
 */
export function getErrorMessage(err: unknown, fallback = 'An error occurred'): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as Record<string, unknown>).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return fallback
}

/**
 * Parse HH:MM (24h) input to an ISO string for today's date.
 * Returns null if the format is invalid.
 */
export function parseTimeToISO(hhmm: string): string | null {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
  if (!match) return null
  const date = new Date()
  date.setHours(parseInt(match[1], 10), parseInt(match[2], 10), 0, 0)
  return date.toISOString()
}

/**
 * Format a duration as relative time (e.g., "5m ago", "2h ago", "3d ago").
 */
export function timeAgo(iso?: string): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / 60000)
  return mins > 0 ? `${mins}m ago` : 'just now'
}
