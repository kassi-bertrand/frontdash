'use client'

import { IconLoader2 } from '@tabler/icons-react'

import { Card, CardContent } from '@/components/ui/card'

interface CardLoadingStateProps {
  /** Message to display next to the spinner */
  message?: string
}

/**
 * Shared loading state component for dashboard cards.
 * Displays a centered spinner with an optional message.
 * Includes ARIA attributes for screen reader accessibility.
 */
export function CardLoadingState({ message = 'Loading...' }: CardLoadingStateProps) {
  return (
    <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
      <CardContent
        className="flex items-center justify-center py-12"
        role="status"
        aria-live="polite"
      >
        <IconLoader2 className="size-6 animate-spin text-emerald-600" aria-hidden="true" />
        <span className="ml-2 text-sm text-neutral-600">{message}</span>
      </CardContent>
    </Card>
  )
}
