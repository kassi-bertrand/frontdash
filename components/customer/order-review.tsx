'use client'

import { useMemo } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useCartStore } from '@/stores/use-cart-store'

export type OrderReviewProps = {
  restaurantSlug: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const formatCurrency = (cents: number) => currencyFormatter.format(cents / 100)

const SERVICE_CHARGE_RATE = 0.0825

/**
 * Order review for STORY-C004 – surfaces line items, subtotal math, and the
 * service charge before checkout.
 */
export function OrderReview({ restaurantSlug }: OrderReviewProps) {
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])

  // Freeze the timestamp when the review loads so the page mirrors a real
  // confirmation screen and doesn't jitter during re-renders.
  const orderPlacedAt = useMemo(() => new Date(), [])
  const formattedTimestamp = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(orderPlacedAt)
  }, [orderPlacedAt])

  // Derive the subtotal, service charge, and grand total up front so every
  // section renders consistent numbers.
  const totals = useMemo(() => {
    if (!cart) {
      return {
        totalItems: 0,
        subtotalCents: 0,
        serviceChargeCents: 0,
        grandTotalCents: 0,
      }
    }

    const items = Object.values(cart.items)
    const subtotalCents = items.reduce(
      (acc, item) => acc + item.priceCents * item.quantity,
      0,
    )
    const serviceChargeCents = Math.round(subtotalCents * SERVICE_CHARGE_RATE)

    return {
      totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotalCents,
      serviceChargeCents,
      grandTotalCents: subtotalCents + serviceChargeCents,
    }
  }, [cart])

  const items = cart ? Object.values(cart.items) : []
  const hasItems = totals.totalItems > 0

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="border-b border-neutral-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-xl font-semibold tracking-tight text-neutral-900"
          >
            Front<span className="font-bold text-red-500">Dash</span>
          </Link>
          <Button asChild variant="ghost" className="rounded-xl px-4 text-sm">
            <Link href={`/restaurant/${restaurantSlug}`}>Back to menu</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Confirm your order</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Double-check the selections and totals before completing payment.
          </p>
        </div>

        {hasItems ? (
          <Card className="rounded-3xl border border-neutral-200 bg-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
            <CardHeader className="border-b border-neutral-200 pb-6">
              <CardTitle className="text-2xl font-semibold text-neutral-900">
                {cart?.restaurant.name}
              </CardTitle>
              <CardDescription className="text-sm text-neutral-500">
                Order started on {formattedTimestamp} • {totals.totalItems} item
                {totals.totalItems === 1 ? '' : 's'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              <div className="overflow-hidden rounded-2xl border border-neutral-200">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                  <thead className="bg-neutral-100/80 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    <tr>
                      <th scope="col" className="px-5 py-3 text-left">
                        Item
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Price
                      </th>
                      <th scope="col" className="px-5 py-3 text-center">
                        Quantity
                      </th>
                      <th scope="col" className="px-5 py-3 text-right">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {items.map((item) => {
                      const lineTotalCents = item.priceCents * item.quantity

                      return (
                        <tr key={item.id} className="align-top">
                          <td className="px-5 py-4">
                            <div className="font-medium text-neutral-900">
                              {item.name}
                            </div>
                            {item.description ? (
                              <p className="mt-1 text-xs text-neutral-500">
                                {item.description}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-5 py-4 text-right text-sm text-neutral-600">
                            {formatCurrency(item.priceCents)}
                          </td>
                          <td className="px-5 py-4 text-center text-sm text-neutral-600">
                            {item.quantity}
                          </td>
                          <td className="px-5 py-4 text-right text-sm font-semibold text-neutral-900">
                            {formatCurrency(lineTotalCents)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col items-stretch gap-3 border-t border-neutral-200 py-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Subtotal (before service charge)</span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(totals.subtotalCents)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-500">Service charge (8.25%)</span>
                <span className="font-medium text-neutral-900">
                  {formatCurrency(totals.serviceChargeCents)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
                <span>Grand total</span>
                <span>{formatCurrency(totals.grandTotalCents)}</span>
              </div>
            </CardFooter>
          </Card>
        ) : (
          <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white/80 p-12 text-center">
            <h2 className="text-xl font-semibold text-neutral-900">Your cart is empty</h2>
            <p className="mt-2 max-w-sm text-sm text-neutral-500">
              Add dishes from the menu to review them before checkout.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="rounded-lg bg-neutral-900 px-5 text-sm text-white hover:bg-neutral-800"
              >
                <Link href={`/restaurant/${restaurantSlug}`}>Browse menu</Link>
              </Button>
              <Button asChild variant="ghost" className="rounded-lg px-5 text-sm">
                <Link href="/">Back to restaurants</Link>
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
