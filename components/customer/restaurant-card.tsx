// Customer browse card used on the landing page to surface a restaurant at a
// glance. The detail page reuses the same mock data.
'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import type { CustomerRestaurant } from '@/lib/types/customer'

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const statusStyles = {
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-neutral-200 text-neutral-600',
}

const statusDotStyles = {
  open: 'bg-emerald-500',
  closed: 'bg-neutral-400',
}

type RestaurantCardProps = {
  restaurant: CustomerRestaurant
}

/**
 * Presentational card for a single restaurant.
 *
 * @param restaurant - Pre-baked mock data describing the restaurant. When the
 * API is ready, this prop should come straight from that response so the UI
 * does not change.
 */
export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const reviewLabel = compactNumber.format(restaurant.reviewCount)
  const statusKey = restaurant.isOpen ? 'open' : 'closed'

  return (
    <Card className="flex h-full w-full flex-col rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_35px_rgba(15,23,42,0.12)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_25px_55px_rgba(15,23,42,0.16)]">
      <CardContent className="flex flex-1 flex-col gap-5 p-6">
        <div className="relative h-44 w-full overflow-hidden rounded-xl bg-neutral-100">
          {restaurant.imageUrl ? (
            <img
              src={restaurant.imageUrl}
              alt={`${restaurant.name} photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="grid h-full w-full place-items-center border border-dashed border-neutral-300 text-neutral-400">
              <span className="text-sm">No photo available</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
              <span className="font-semibold text-neutral-800">
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
            <span aria-hidden className="text-neutral-300">
              •
            </span>
            <span>{reviewLabel}</span>
            <span aria-hidden className="text-neutral-300">
              •
            </span>
            <span>{restaurant.priceTier}</span>
            <span aria-hidden className="text-neutral-300">
              •
            </span>
            <span>{restaurant.cuisine}</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
            {restaurant.name}
          </h2>

          <p className="text-[15px] leading-7 text-neutral-600">
            {restaurant.shortDescription}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {restaurant.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full border border-neutral-200 bg-neutral-100/80 px-3 py-1 text-xs font-medium text-neutral-600"
            >
              {tag}
            </Badge>
          ))}
          <Badge
            className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              statusStyles[statusKey]
            }`}
          >
            <span
              className={`inline-block h-2 w-2 rounded-full ${statusDotStyles[statusKey]}`}
            />
            {restaurant.isOpen ? 'Open' : 'Closed'}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="px-6 pb-6">
        <Button
          asChild
          className="w-full rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 h-12"
        >
          <Link href={`/restaurant/${restaurant.slug}`}>View menu</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
