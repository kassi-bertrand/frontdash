// STORY-C002 detail screen: surfaces a single restaurant with its static menu
// until real data is available.
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { demoCustomerRestaurants, type CustomerRestaurant } from '@/lib/demo-restaurants'

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
  closed: 'bg-neutral-500',
}

type RestaurantPageProps = {
  params: { slug: string }
}

// Pre-render all mock slugs so the detail route works out of the box.
export function generateStaticParams() {
  return demoCustomerRestaurants.map((restaurant) => ({ slug: restaurant.slug }))
}

/**
 * Route entry point – looks up the restaurant by slug and renders the detail
 * view. Falls back to Next.js 404 if the slug is missing from the mock data.
 */
export default function RestaurantPage({ params }: RestaurantPageProps) {
  const restaurant = demoCustomerRestaurants.find((item) => item.slug === params.slug)

  if (!restaurant) {
    notFound()
  }

  return <RestaurantDetail restaurant={restaurant} />
}

/**
 * Displays the full restaurant profile, including menu sections, using the
 * same demo data as the homepage.
 */
function RestaurantDetail({ restaurant }: { restaurant: CustomerRestaurant }) {
  const statusKey = restaurant.isOpen ? 'open' : 'closed'
  const reviewLabel = compactNumber.format(restaurant.reviewCount)

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Front<span className="font-bold text-neutral-500">Dash</span>
          </Link>
          <Button asChild variant="ghost" className="rounded-xl px-4 text-sm">
            <Link href="/">Back to all restaurants</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto mt-12 w-full max-w-5xl px-6">
        <Button
          asChild
          variant="ghost"
          className="mb-8 flex items-center gap-2 rounded-xl px-3 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back to browse
          </Link>
        </Button>

        <section className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
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

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">
                {restaurant.name}
              </h1>
              <Badge
                className={`flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                  statusStyles[statusKey]
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${statusDotStyles[statusKey]}`}
                />
                {restaurant.isOpen ? 'Open' : 'Closed'}
              </Badge>
            </div>

            <p className="max-w-2xl text-base leading-7 text-neutral-600">
              {restaurant.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              {restaurant.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600"
                >
                  {tag}
                </Badge>
              ))}
              <Badge
                variant="secondary"
                className="rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-600"
              >
                {restaurant.neighborhood}
              </Badge>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Menu</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {restaurant.menu.map((section) => (
              <Card
                key={section.title}
                className="rounded-2xl border border-neutral-200 bg-white"
              >
                <CardContent className="space-y-4 p-6">
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-neutral-700">
                      {section.title}
                    </h3>
                    <div className="mt-1 h-1 w-10 rounded-full bg-neutral-200" />
                  </div>
                  <ul className="space-y-4">
                    {section.items.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-baseline justify-between gap-4"
                      >
                        <div>
                          <p className="text-[15px] font-medium text-neutral-900">
                            {item.name}
                          </p>
                          {item.description ? (
                            <p className="text-sm text-neutral-500">{item.description}</p>
                          ) : null}
                        </div>
                        <span className="text-sm font-semibold text-neutral-800">
                          {item.price}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
