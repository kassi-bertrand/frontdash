'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCartStore } from '@/stores/use-cart-store'
import type { TipState } from '@/stores/use-cart-store'

export type OrderReviewProps = {
  restaurantSlug: string
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const formatCurrency = (cents: number) => currencyFormatter.format(cents / 100)

const SERVICE_CHARGE_RATE = 0.0825
const TIP_PERCENT_MAX = 100
const TIP_FIXED_MAX_CENTS = 50000

/**
 * Order review for STORY-C004/C005 – surfaces line items, service charge, and
 * now customer tips prior to payment.
 */
export function OrderReview({ restaurantSlug }: OrderReviewProps) {
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])
  const setTip = useCartStore((state) => state.setTip)

  const [percentInput, setPercentInput] = useState('')
  const [fixedInput, setFixedInput] = useState('')

  // Freeze the timestamp when the review loads so the page mirrors a real
  // confirmation screen and doesn't jitter during re-renders.
  const orderPlacedAt = useMemo(() => new Date(), [])
  const formattedTimestamp = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(orderPlacedAt)
  }, [orderPlacedAt])

  const tipState = useMemo<TipState>(() => cart?.tip ?? { mode: 'none' }, [cart?.tip])

  // Derive the subtotal, service charge, and grand total up front so every
  // section renders consistent numbers.
  const totals = useMemo(() => {
    if (!cart) {
      return {
        totalItems: 0,
        subtotalCents: 0,
        serviceChargeCents: 0,
        tipCents: 0,
        grandTotalCents: 0,
      }
    }

    const items = Object.values(cart.items)
    const subtotalCents = items.reduce(
      (acc, item) => acc + item.priceCents * item.quantity,
      0,
    )
    const serviceChargeCents = Math.round(subtotalCents * SERVICE_CHARGE_RATE)
    let tipCents = 0

    if (cart.tip?.mode === 'percent') {
      tipCents = Math.round(subtotalCents * (Math.max(cart.tip.percent, 0) / 100))
    } else if (cart.tip?.mode === 'fixed') {
      tipCents = Math.max(cart.tip.cents, 0)
    }

    return {
      totalItems: items.reduce((acc, item) => acc + item.quantity, 0),
      subtotalCents,
      serviceChargeCents,
      tipCents,
      grandTotalCents: subtotalCents + serviceChargeCents + tipCents,
    }
  }, [cart])

  const items = cart ? Object.values(cart.items) : []
  const hasItems = totals.totalItems > 0

  // Mirror the persisted tip state back into the form controls so refreshing the
  // page or navigating away and back keeps the UI in sync.
  useEffect(() => {
    if (!cart) {
      if (percentInput !== '') {
        setPercentInput('')
      }
      if (fixedInput !== '') {
        setFixedInput('')
      }
      return
    }

    if (tipState.mode === 'percent') {
      const nextPercent = tipState.percent === 0 ? '' : String(tipState.percent)
      if (percentInput !== nextPercent) {
        setPercentInput(nextPercent)
      }
      if (fixedInput !== '') {
        setFixedInput('')
      }
    } else if (tipState.mode === 'fixed') {
      const dollars = tipState.cents / 100
      const nextFixed = tipState.cents === 0 ? '' : dollars.toFixed(2)
      if (fixedInput !== nextFixed) {
        setFixedInput(nextFixed)
      }
      if (percentInput !== '') {
        setPercentInput('')
      }
    } else {
      if (percentInput !== '') {
        setPercentInput('')
      }
      if (fixedInput !== '') {
        setFixedInput('')
      }
    }
  }, [cart, tipState, percentInput, fixedInput])

  const handleTipModeChange = (value: string) => {
    if (!cart) {
      return
    }

    const nextMode = (value || 'none') as TipState['mode']

    if (nextMode === 'percent') {
      const existingPercent = cart.tip?.mode === 'percent' ? cart.tip.percent : 0
      setTip({ restaurantSlug, tip: { mode: 'percent', percent: existingPercent } })
      if (existingPercent === 0) {
        setPercentInput('')
      }
    } else if (nextMode === 'fixed') {
      const existingCents = cart.tip?.mode === 'fixed' ? cart.tip.cents : 0
      setTip({ restaurantSlug, tip: { mode: 'fixed', cents: existingCents } })
      if (existingCents === 0) {
        setFixedInput('')
      }
    } else {
      setTip({ restaurantSlug, tip: { mode: 'none' } })
      setPercentInput('')
      setFixedInput('')
    }
  }

  // Percent-based tips cap at TIP_PERCENT_MAX to keep inputs realistic.
  const handlePercentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setPercentInput(value)

    if (!cart) {
      return
    }

    if (value.trim() === '') {
      setTip({ restaurantSlug, tip: { mode: 'percent', percent: 0 } })
      return
    }

    const numeric = Number.parseFloat(value)
    if (!Number.isFinite(numeric)) {
      return
    }

    const clamped = Math.min(Math.max(numeric, 0), TIP_PERCENT_MAX)
    const rounded = Math.round(clamped * 100) / 100
    setTip({ restaurantSlug, tip: { mode: 'percent', percent: rounded } })
  }

  // Fixed tips clamp to $500 (TIP_FIXED_MAX_CENTS) to avoid wildly large values.
  const handleFixedChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target
    setFixedInput(value)

    if (!cart) {
      return
    }

    if (value.trim() === '') {
      setTip({ restaurantSlug, tip: { mode: 'fixed', cents: 0 } })
      return
    }

    const numeric = Number.parseFloat(value)
    if (!Number.isFinite(numeric)) {
      return
    }

    const clamped = Math.min(Math.max(numeric, 0), TIP_FIXED_MAX_CENTS / 100)
    const cents = Math.round(clamped * 100)
    setTip({ restaurantSlug, tip: { mode: 'fixed', cents } })
  }

  const tipSummaryLabel = useMemo(() => {
    if (tipState.mode === 'percent') {
      return `Tip (${tipState.percent}% of subtotal)`
    }

    if (tipState.mode === 'fixed') {
      return 'Tip (custom amount)'
    }

    return 'Tip (not added)'
  }, [tipState])

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
          <>
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

                <div className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5">
                  <div className="space-y-1">
                    <h2 className="text-lg font-semibold text-neutral-900">
                      Add a tip (optional)
                    </h2>
                    <p className="text-sm text-neutral-500">
                      Choose a percentage of the subtotal or enter a fixed dollar amount.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Toggle buttons wrap on small screens so the options never overlap. */}
                    <ToggleGroup
                      type="single"
                      value={tipState.mode === 'none' ? 'none' : tipState.mode}
                      onValueChange={handleTipModeChange}
                      className="w-full flex-wrap gap-2 sm:w-auto"
                    >
                      <ToggleGroupItem
                        className="basis-full grow-0 sm:basis-auto sm:grow"
                        value="none"
                      >
                        No tip
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        className="basis-full grow-0 sm:basis-auto sm:grow"
                        value="percent"
                      >
                        Percent
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        className="basis-full grow-0 sm:basis-auto sm:grow"
                        value="fixed"
                      >
                        Custom amount
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {tipState.mode === 'percent' ? (
                      <div className="flex w-full flex-col gap-2 sm:w-48">
                        <Label htmlFor="tip-percent">Tip percentage</Label>
                        <Input
                          id="tip-percent"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={TIP_PERCENT_MAX}
                          step="0.5"
                          placeholder="e.g. 18"
                          value={percentInput}
                          onChange={handlePercentChange}
                        />
                        <p className="text-xs text-neutral-500">
                          Applied to the subtotal before service charge.
                        </p>
                      </div>
                    ) : tipState.mode === 'fixed' ? (
                      <div className="flex w-full flex-col gap-2 sm:w-48">
                        <Label htmlFor="tip-fixed">Tip amount</Label>
                        <Input
                          id="tip-fixed"
                          type="number"
                          inputMode="decimal"
                          min={0}
                          step="0.01"
                          placeholder="e.g. 5"
                          value={fixedInput}
                          onChange={handleFixedChange}
                        />
                        <p className="text-xs text-neutral-500">
                          Rounded to the nearest cent.
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">
                        Select a tip style to enter an amount.
                      </p>
                    )}
                  </div>

                  <p className="text-sm font-medium text-neutral-600">
                    Current tip total: {formatCurrency(totals.tipCents)}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-stretch gap-3 border-t border-neutral-200 py-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">
                    Subtotal (before service charge)
                  </span>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{tipSummaryLabel}</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(totals.tipCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
                  <span>Grand total</span>
                  <span>{formatCurrency(totals.grandTotalCents)}</span>
                </div>
              </CardFooter>
            </Card>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                asChild
                variant="outline"
                className="h-11 w-full rounded-lg border border-neutral-300 px-5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 sm:w-auto"
              >
                <Link href={`/restaurant/${restaurantSlug}`}>Modify order</Link>
              </Button>
              <Button
                asChild
                className="h-11 w-full rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800 sm:w-auto"
              >
                <Link href={`/payment/${restaurantSlug}`}>Proceed to payment</Link>
              </Button>
            </div>
          </>
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
