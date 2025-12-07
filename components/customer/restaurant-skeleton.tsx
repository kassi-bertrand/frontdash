/**
 * Loading skeleton for restaurant cards.
 *
 * Displays placeholder cards while restaurants are being fetched.
 * Matches the layout of RestaurantCard for a smooth loading experience.
 */
'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/card'

/**
 * Animated pulse effect for skeleton elements.
 * Uses Tailwind's animate-pulse for a subtle loading animation.
 */
function SkeletonBox({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-neutral-200 ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

/**
 * Single skeleton card matching RestaurantCard layout.
 *
 * Shows:
 * - Photo placeholder area
 * - Rating/reviews/price line
 * - Restaurant name
 * - Description text
 * - Tags
 * - Button
 */
export function RestaurantCardSkeleton() {
  return (
    <Card className="flex h-full w-full flex-col rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)]">
      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        {/* Photo placeholder */}
        <SkeletonBox className="h-44 w-full rounded-xl" />

        <div className="flex flex-col gap-3">
          {/* Rating line: stars, reviews, price, cuisine */}
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-4 w-12" />
            <SkeletonBox className="h-4 w-8" />
            <SkeletonBox className="h-4 w-6" />
            <SkeletonBox className="h-4 w-16" />
          </div>

          {/* Restaurant name */}
          <SkeletonBox className="h-8 w-3/4" />

          {/* Description (2 lines) */}
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-full" />
            <SkeletonBox className="h-5 w-2/3" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-7 w-20 rounded-full" />
          <SkeletonBox className="h-7 w-16 rounded-full" />
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6">
        {/* View menu button */}
        <SkeletonBox className="h-12 w-full rounded-lg" />
      </CardFooter>
    </Card>
  )
}

/**
 * Grid of skeleton cards for the homepage loading state.
 *
 * @param count - Number of skeleton cards to show (default: 6)
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <RestaurantSkeletonGrid count={6} />
 * }
 * ```
 */
export function RestaurantSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading restaurants"
    >
      {Array.from({ length: count }).map((_, i) => (
        <RestaurantCardSkeleton key={i} />
      ))}
      <span className="sr-only">Loading restaurants...</span>
    </div>
  )
}
