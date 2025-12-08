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
