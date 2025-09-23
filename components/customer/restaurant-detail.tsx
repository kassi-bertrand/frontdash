'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Minus, Plus, ShoppingBag, Star } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { CustomerRestaurant, RestaurantMenuItem } from '@/lib/demo-restaurants'
import { useCartStore } from '@/stores/use-cart-store'

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const restaurantStatusStyles = {
  open: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-neutral-200 text-neutral-600',
}

const restaurantStatusDots = {
  open: 'bg-emerald-500',
  closed: 'bg-neutral-500',
}

type RestaurantDetailProps = {
  restaurant: CustomerRestaurant
}

const formatPrice = (cents: number) => currencyFormatter.format(cents / 100)

const availabilityBadge = (isAvailable: boolean) =>
  isAvailable
    ? { label: 'Available', className: 'bg-emerald-100 text-emerald-700' }
    : { label: 'Unavailable', className: 'bg-neutral-200 text-neutral-500' }

export function RestaurantDetail({ restaurant }: RestaurantDetailProps) {
  const statusKey = restaurant.isOpen ? 'open' : 'closed'
  const reviewLabel = compactNumber.format(restaurant.reviewCount)

  const setActiveRestaurant = useCartStore((state) => state.setActiveRestaurant)
  const incrementItem = useCartStore((state) => state.incrementItem)
  const decrementItem = useCartStore((state) => state.decrementItem)
  const cartForRestaurant = useCartStore(
    (state) => state.cartsByRestaurant[restaurant.slug],
  )

  // Register the current restaurant in the global store so its cart survives
  // when the guest hops between menus.
  useEffect(() => {
    setActiveRestaurant({ slug: restaurant.slug, name: restaurant.name })
  }, [restaurant.name, restaurant.slug, setActiveRestaurant])

  // Flatten the stored cart items into an array for subtotal math and the sticky
  // footer badge.
  const selectedItems = useMemo(() => {
    if (!cartForRestaurant) {
      return []
    }

    return Object.values(cartForRestaurant.items)
  }, [cartForRestaurant])

  const totalItems = selectedItems.reduce((acc, entry) => acc + entry.quantity, 0)
  const subtotalCents = selectedItems.reduce(
    (acc, entry) => acc + entry.priceCents * entry.quantity,
    0,
  )

  const handleIncrease = (menuItem: RestaurantMenuItem) => {
    if (!menuItem.isAvailable) {
      return
    }

    // Snapshot the essential item data in the store so we can render summaries
    // outside of the menu context (e.g., on the checkout page).
    incrementItem({
      restaurant: { slug: restaurant.slug, name: restaurant.name },
      item: {
        id: menuItem.id,
        name: menuItem.name,
        priceCents: menuItem.priceCents,
        description: menuItem.description,
        imageUrl: menuItem.imageUrl,
      },
    })
  }

  const handleDecrease = (menuItem: RestaurantMenuItem) => {
    decrementItem({ restaurantSlug: restaurant.slug, itemId: menuItem.id })
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-28 text-neutral-900">
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
                className={cn(
                  'flex items-center gap-2 rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                  restaurantStatusStyles[statusKey],
                )}
              >
                <span
                  className={cn(
                    'inline-block h-2 w-2 rounded-full',
                    restaurantStatusDots[statusKey],
                  )}
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
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">
              Menu
            </h2>
            <p className="text-sm text-neutral-500">
              Tap items to build your order. Adjust quantities with the controls on each
              card.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {restaurant.menu.map((section) => (
              <Card
                key={section.title}
                className="rounded-2xl border border-neutral-200 bg-white"
              >
                <CardContent className="space-y-5 p-6">
                  <div>
                    <h3 className="text-base font-semibold uppercase tracking-wide text-neutral-700">
                      {section.title}
                    </h3>
                    <div className="mt-1 h-1 w-10 rounded-full bg-neutral-200" />
                  </div>

                  <ul className="space-y-5">
                    {section.items.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        quantity={cartForRestaurant?.items[item.id]?.quantity ?? 0}
                        onIncrease={() => handleIncrease(item)}
                        onDecrease={() => handleDecrease(item)}
                      />
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {totalItems > 0 ? (
          <aside className="sticky bottom-0 mt-12">
            <Card className="border border-neutral-200 bg-white shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)]">
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">
                    {totalItems} item{totalItems > 1 ? 's' : ''} selected
                  </p>
                  <p className="text-sm text-neutral-500">
                    Subtotal {formatPrice(subtotalCents)}
                  </p>
                </div>
                <Button
                  asChild
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 px-5 py-2 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
                >
                  <Link href={`/checkout/${restaurant.slug}`}>
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                    Review order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </aside>
        ) : null}
      </main>
    </div>
  )
}

type MenuItemCardProps = {
  item: RestaurantMenuItem
  quantity: number
  onIncrease: () => void
  onDecrease: () => void
}

function MenuItemCard({ item, quantity, onIncrease, onDecrease }: MenuItemCardProps) {
  const availability = availabilityBadge(item.isAvailable)

  return (
    <li className="flex gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/60 p-4 transition hover:border-neutral-300 hover:bg-white">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            sizes="96px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            Photo coming soon
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-neutral-900">{item.name}</p>
              {item.description ? (
                <p className="text-sm text-neutral-500">{item.description}</p>
              ) : null}
            </div>
            <span className="text-sm font-semibold text-neutral-800">
              {formatPrice(item.priceCents)}
            </span>
          </div>

          <Badge
            className={cn(
              'w-fit rounded-full px-3 py-1 text-xs font-medium',
              availability.className,
            )}
          >
            {availability.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onDecrease}
              disabled={quantity === 0}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Remove one {item.name}</span>
            </Button>
            <span className="w-6 text-center text-sm font-semibold text-neutral-900">
              {quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onIncrease}
              disabled={!item.isAvailable}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Add one {item.name}</span>
            </Button>
          </div>

          {!item.isAvailable ? (
            <span className="text-xs font-medium uppercase tracking-wide text-neutral-400">
              Temporarily unavailable
            </span>
          ) : null}
        </div>
      </div>
    </li>
  )
}
