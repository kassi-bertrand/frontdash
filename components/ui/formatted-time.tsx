/**
 * FormattedTime Component
 * =============================================================================
 * Displays a formatted date/time from an ISO string.
 * Uses a stable UTC formatter to avoid hydration mismatches in Next.js.
 *
 * Usage:
 *   <FormattedTime iso="2024-01-15T10:30:00Z" />
 *   // Output: 1/15/2024, 10:30 AM
 *
 *   <FormattedTime iso={order.deliveredAt} fallback="Not delivered" />
 * =============================================================================
 */

// Stable minute-only formatter (UTC) - avoids hydration issues
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

interface FormattedTimeProps {
  /** ISO 8601 date string to format */
  iso?: string | null
  /** Fallback text when iso is null/undefined (default: "—") */
  fallback?: string
  /** Additional CSS classes */
  className?: string
}

export function FormattedTime({ iso, fallback = '—', className }: FormattedTimeProps) {
  if (!iso) {
    return <span className={className}>{fallback}</span>
  }

  return (
    <span className={className} suppressHydrationWarning>
      {dateTimeFormatter.format(new Date(iso))}
    </span>
  )
}

/**
 * Utility function to format time without a component.
 * Useful when you need the string value directly.
 */
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}
