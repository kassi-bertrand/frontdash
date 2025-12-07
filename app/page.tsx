/**
 * Customer Homepage
 *
 * Lists all approved restaurants from the backend API.
 * Customers can browse and click through to individual menu pages.
 *
 * Data flow:
 * 1. useRestaurants() fetches from GET /api/restaurants
 * 2. Backend data is transformed to CustomerRestaurant format
 * 3. RestaurantCard components display each restaurant
 */
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RestaurantCard } from '@/components/customer/restaurant-card'
import { RestaurantSkeletonGrid } from '@/components/customer/restaurant-skeleton'
import { useRestaurants } from '@/hooks/use-restaurants'

/**
 * Error state shown when restaurant fetch fails.
 * Provides a retry button so users can attempt to reload.
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">😕</div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900">
        Something went wrong
      </h3>
      <p className="mb-6 max-w-md text-sm text-neutral-600">{message}</p>
      <Button onClick={onRetry} variant="outline" className="rounded-xl">
        Try again
      </Button>
    </div>
  )
}

/**
 * Empty state shown when no restaurants are available.
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-4xl">🍽️</div>
      <h3 className="mb-2 text-lg font-medium text-neutral-900">
        No restaurants yet
      </h3>
      <p className="max-w-md text-sm text-neutral-600">
        Check back soon—new restaurants are being added all the time.
      </p>
    </div>
  )
}

/**
 * Customer homepage: hero copy + restaurant grid from backend API.
 */
export default function Home() {
  const { restaurants, isLoading, error, refetch } = useRestaurants()


  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-neutral-900"
          >
            Front<span className="font-bold text-red-500">Dash</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Button asChild variant="ghost" className="rounded-xl px-4 text-sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="rounded-xl bg-neutral-900 px-4 text-sm hover:bg-neutral-800"
            >
              <Link href="/register-restaurant">Register a Restaurant</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero section with stats */}
        <section className="border-b border-neutral-200 bg-gradient-to-b from-white via-white to-neutral-50">
          <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
            <div className="space-y-5 lg:col-span-2">
              <Badge
                variant="secondary"
                className="border border-neutral-200 bg-neutral-100/80 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500"
              >
                Discover & order
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
                Dinner plans in one place.
              </h1>
              <p className="max-w-xl text-base leading-7 text-neutral-600 sm:text-lg">
                Browse every partner restaurant in real time and jump straight into the
                menu when inspiration strikes. No logins required—just pick, order, and
                enjoy.
              </p>
              {/* Stats line - only show when we have data */}
              {!isLoading && !error && restaurants.length > 0 && (
                <div className="text-sm text-neutral-500">
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} available
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Restaurant catalogue */}
        <section className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">
              Explore every restaurant
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              All available partners appear here—tap any card to continue to the
              restaurant menu.
            </p>
          </div>

          {/* Loading state */}
          {isLoading && <RestaurantSkeletonGrid count={6} />}

          {/* Error state */}
          {error && <ErrorState message={error} onRetry={refetch} />}

          {/* Empty state */}
          {!isLoading && !error && restaurants.length === 0 && <EmptyState />}

          {/* Restaurant grid */}
          {!isLoading && !error && restaurants.length > 0 && (
            <div
              id="restaurants-grid"
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            >
              {restaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
