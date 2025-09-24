'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock3, MapPin, Phone } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/stores/use-cart-store'

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  timeStyle: 'short',
})

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'full',
})

type OrderConfirmationProps = {
  restaurantSlug: string
}

type OrderSnapshot = {
  orderNumber: string
  placedAt: Date
  estimatedStart: Date
  estimatedEnd: Date
  restaurantName: string
  items: Array<{
    id: string
    name: string
    quantity: number
    priceCents: number
    subtotalCents: number
  }>
  totals: {
    subtotalCents: number
    serviceChargeCents: number
    tipCents: number
    grandTotalCents: number
  }
  delivery: {
    buildingNumber: string
    streetName: string
    apartment?: string
    city: string
    state: string
    contactName: string
    contactPhone: string
  }
}

const formatPhone = (value: string) => {
  if (value.length !== 10) {
    return value
  }
  return `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`
}

const minutesToMs = (minutes: number) => minutes * 60 * 1000

const generateOrderNumber = () => {
  const now = new Date()
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate(),
  ).padStart(2, '0')}`
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FD-${stamp}-${random}`
}

const buildEstimateWindow = () => {
  const startMinutes = 30 + Math.floor(Math.random() * 11) // 30-40 minutes
  const endMinutes = startMinutes + 10
  const now = new Date()
  return {
    start: new Date(now.getTime() + minutesToMs(startMinutes)),
    end: new Date(now.getTime() + minutesToMs(endMinutes)),
  }
}

export function OrderConfirmation({ restaurantSlug }: OrderConfirmationProps) {
  const router = useRouter()
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])
  const clearCart = useCartStore((state) => state.clearCart)

  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null)

  useEffect(() => {
    if (!cart) {
      if (!snapshot) {
        router.replace('/')
      }
      return
    }

    if (snapshot) {
      return
    }

    const items = Object.values(cart.items)
    if (items.length === 0) {
      router.replace(`/restaurant/${restaurantSlug}`)
      return
    }

    if (!cart.delivery) {
      router.replace(`/delivery/${restaurantSlug}`)
      return
    }

    const subtotalCents = items.reduce(
      (acc, item) => acc + item.priceCents * item.quantity,
      0,
    )
    const serviceChargeCents = Math.round(subtotalCents * 0.0825)
    const tipCents =
      cart.tip?.mode === 'percent'
        ? Math.round(subtotalCents * (cart.tip.percent / 100))
        : cart.tip?.mode === 'fixed'
          ? cart.tip.cents
          : 0

    const { start, end } = buildEstimateWindow()

    setSnapshot({
      orderNumber: generateOrderNumber(),
      placedAt: new Date(),
      estimatedStart: start,
      estimatedEnd: end,
      restaurantName: cart.restaurant.name,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        priceCents: item.priceCents,
        subtotalCents: item.priceCents * item.quantity,
      })),
      totals: {
        subtotalCents,
        serviceChargeCents,
        tipCents,
        grandTotalCents: subtotalCents + serviceChargeCents + tipCents,
      },
      delivery: cart.delivery,
    })

    clearCart(cart.restaurant.slug)
  }, [cart, clearCart, restaurantSlug, router, snapshot])

  const totals = snapshot?.totals

  const orderTotals = useMemo(() => {
    if (!totals) {
      return null
    }
    return [
      {
        label: 'Subtotal',
        value: currency.format(totals.subtotalCents / 100),
      },
      {
        label: 'Service charge (8.25%)',
        value: currency.format(totals.serviceChargeCents / 100),
      },
      {
        label: 'Tip',
        value: currency.format(totals.tipCents / 100),
      },
      {
        label: 'Total charged',
        value: currency.format(totals.grandTotalCents / 100),
        emphasize: true,
      },
    ]
  }, [totals])

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wrapping things up…</CardTitle>
          <CardDescription>Hold tight while we finalize your order.</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')}>Back to restaurants</Button>
        </CardFooter>
      </Card>
    )
  }

  const deliveryLines = [
    `${snapshot.delivery.buildingNumber} ${snapshot.delivery.streetName}`,
    snapshot.delivery.apartment,
    `${snapshot.delivery.city}, ${snapshot.delivery.state}`,
  ].filter(Boolean)

  return (
    <Card className="rounded-3xl border border-neutral-200 bg-white shadow-[0_25px_70px_-45px_rgba(15,23,42,0.35)]">
      <CardHeader className="space-y-4 border-b border-neutral-200 pb-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            Order confirmed
          </Badge>
          <span className="text-sm text-neutral-500">{snapshot.restaurantName}</span>
        </div>
        <CardTitle className="text-3xl font-semibold text-neutral-900">
          Order #{snapshot.orderNumber}
        </CardTitle>
        <CardDescription className="text-sm text-neutral-500">
          Placed on {dateFormatter.format(snapshot.placedAt)} at{' '}
          {timeFormatter.format(snapshot.placedAt)}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-8 p-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <Clock3 className="h-10 w-10 text-neutral-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-neutral-600">Estimated arrival</p>
              <p className="text-lg font-semibold text-neutral-900">
                {timeFormatter.format(snapshot.estimatedStart)} –{' '}
                {timeFormatter.format(snapshot.estimatedEnd)}
              </p>
              <p className="text-xs text-neutral-500">
                We’ll notify you when the driver is on your block.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">Delivery details</h2>
            <div className="flex items-start gap-3 text-sm text-neutral-600">
              <MapPin className="mt-1 h-4 w-4 text-neutral-400" aria-hidden="true" />
              <div>
                <p className="font-medium text-neutral-900">
                  {snapshot.delivery.contactName}
                </p>
                {deliveryLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400" aria-hidden="true" />
              <span>{formatPhone(snapshot.delivery.contactPhone)}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              Items in this order
            </h2>
            <ul className="space-y-3 text-sm text-neutral-700">
              {snapshot.items.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-neutral-900">{item.name}</p>
                    <p className="text-xs text-neutral-500">
                      {currency.format(item.priceCents / 100)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">×{item.quantity}</p>
                    <p className="text-xs text-neutral-500">
                      {currency.format(item.subtotalCents / 100)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
            <h2 className="text-lg font-semibold text-neutral-900">Payment summary</h2>
            <Separator className="my-4" />
            <dl className="space-y-2 text-sm text-neutral-600">
              {orderTotals?.map((total) => (
                <div
                  key={total.label}
                  className={`flex items-center justify-between ${
                    total.emphasize
                      ? 'border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900'
                      : ''
                  }`}
                >
                  <dt>{total.label}</dt>
                  <dd>{total.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t border-neutral-200 p-6 sm:flex-row sm:justify-between">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => router.push('/')}
        >
          Back to restaurants
        </Button>
        <Button type="button" disabled className="w-full sm:w-auto">
          Track order (coming soon)
        </Button>
      </CardFooter>
    </Card>
  )
}
