// STORY-C001 landing experience: lists every restaurant and routes customers
// into the individual menu pages.
'use client'

import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RestaurantCard } from '@/components/customer/restaurant-card'
import { demoCustomerRestaurants } from '@/lib/demo-restaurants'

/**
 * Customer homepage: hero copy + full restaurant grid sourced from the demo
 * dataset. Replace the data hook once the public browse API exists.
 */
export default function Home() {
  const openNow = demoCustomerRestaurants.filter((restaurant) => restaurant.isOpen).length

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
        {/* Overview hero keeps customers oriented before they dive into the grid. */}
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
              <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                <span>{demoCustomerRestaurants.length} restaurants</span>
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-300" aria-hidden />
                <span>{openNow} open right now</span>
              </div>
            </div>
          </div>
        </section>

        {/* Full catalogue satisfies STORY-C001 by showing every restaurant. */}
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

          <div id="restaurants-grid" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {demoCustomerRestaurants.map((restaurant) => (
              <RestaurantCard key={restaurant.id} restaurant={restaurant} />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
