/**
 * Restaurant Detail Page
 *
 * Displays a single restaurant with its full menu.
 * Fetches data from the backend API using the URL slug.
 *
 * Data flow:
 * 1. Extract slug from URL params
 * 2. useRestaurant(slug) fetches restaurant + menu from API
 * 3. RestaurantDetail component displays the data
 */
'use client'

import { use } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RestaurantDetail } from '@/components/customer/restaurant-detail'
import { useRestaurant } from '@/hooks/use-restaurant'

type RestaurantPageProps = {
  params: Promise<{ slug: string }>
}

/**
 * Loading skeleton for the restaurant detail page.
 * Matches the layout of RestaurantDetail for smooth loading.
 */
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="h-9 w-40 animate-pulse rounded-xl bg-neutral-200" />
        </div>
      </header>

      <main className="mx-auto mt-12 w-full max-w-5xl px-6">
        {/* Back button */}
        <div className="mb-8 h-9 w-32 animate-pulse rounded-xl bg-neutral-200" />

        {/* Restaurant info card */}
        <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="space-y-4">
            <div className="h-4 w-48 animate-pulse rounded bg-neutral-200" />
            <div className="h-10 w-64 animate-pulse rounded bg-neutral-200" />
            <div className="h-16 w-full max-w-2xl animate-pulse rounded bg-neutral-200" />
            <div className="flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-full bg-neutral-200" />
              <div className="h-7 w-24 animate-pulse rounded-full bg-neutral-200" />
            </div>
          </div>
        </div>

        {/* Menu section */}
        <div className="mt-12 space-y-6">
          <div className="h-8 w-24 animate-pulse rounded bg-neutral-200" />
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-80 animate-pulse rounded-2xl border border-neutral-200 bg-neutral-100"
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

/**
 * 404 state shown when restaurant is not found.
 */
function NotFoundState() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="mb-4 text-6xl">🍽️</div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Restaurant not found
      </h1>
      <p className="mb-6 text-neutral-600">
        We couldn&apos;t find the restaurant you&apos;re looking for.
      </p>
      <Button asChild className="rounded-xl">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all restaurants
        </Link>
      </Button>
    </div>
  )
}

/**
 * Error state shown when fetch fails.
 */
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-6">
      <div className="mb-4 text-6xl">😕</div>
      <h1 className="mb-2 text-2xl font-semibold text-neutral-900">
        Something went wrong
      </h1>
      <p className="mb-6 max-w-md text-center text-neutral-600">{message}</p>
      <Button asChild className="rounded-xl">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all restaurants
        </Link>
      </Button>
    </div>
  )
}

/**
 * Route entry point – fetches restaurant by slug from API.
 */
export default function RestaurantPage({ params }: RestaurantPageProps) {
  // Unwrap the params promise (Next.js 15 async params)
  const { slug } = use(params)
  const { restaurant, isLoading, error, notFound } = useRestaurant(slug)

  if (isLoading) {
    return <DetailSkeleton />
  }

  if (notFound) {
    return <NotFoundState />
  }

  if (error) {
    return <ErrorState message={error} />
  }

  // TypeScript safety: restaurant should never be null here after above checks,
  // but we guard anyway for defensive programming
  if (!restaurant) {
    return <NotFoundState />
  }

  return <RestaurantDetail restaurant={restaurant} />
}
