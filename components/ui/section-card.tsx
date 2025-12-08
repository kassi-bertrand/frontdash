/**
 * SectionCard Component
 * =============================================================================
 * A simple card component with a title and optional action area.
 * Used in staff dashboard pages for grouping related content.
 *
 * Usage:
 *   <SectionCard title="Order Queue">
 *     <ul>...</ul>
 *   </SectionCard>
 *
 *   <SectionCard
 *     title="Retrieve Orders"
 *     right={<Button>Retrieve First</Button>}
 *   >
 *     <p>Select an order to retrieve...</p>
 *   </SectionCard>
 * =============================================================================
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  /** Card title displayed in the header */
  title: string
  /** Content to display in the card body */
  children: React.ReactNode
  /** Optional content for the right side of the header (e.g., buttons) */
  right?: React.ReactNode
  /** Additional CSS classes for the card container */
  className?: string
}

export function SectionCard({ title, children, right, className }: SectionCardProps) {
  return (
    <div className={cn('rounded-lg border bg-background p-4 shadow-sm', className)}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}
