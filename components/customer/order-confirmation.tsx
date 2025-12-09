'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock3, MapPin, Phone, AlertCircle } from 'lucide-react'

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
import { orderApi } from '@/lib/api'
import { calculateOrderTotals } from '@/lib/checkout-utils'
import { formatCurrency } from '@/lib/utils'

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
  estimatedDeliveryTime: Date
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
    zipCode: string
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

export function OrderConfirmation({ restaurantSlug }: OrderConfirmationProps) {
  const router = useRouter()
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])
  const clearCart = useCartStore((state) => state.clearCart)

  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Prevent double submission
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    // If we already have a snapshot, don't do anything
    if (snapshot) {
      return
    }

    // If cart doesn't exist and no snapshot, redirect home
    if (!cart) {
      router.replace('/')
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

    if (!cart.payment || !cart.billing) {
      router.replace(`/payment/${restaurantSlug}`)
      return
    }

    // Prevent double submission
    if (hasSubmittedRef.current) {
      return
    }
    hasSubmittedRef.current = true

    // Extract validated values after guards (avoids ! assertions)
    const delivery = cart.delivery
    const payment = cart.payment
    const billing = cart.billing
    const restaurant = cart.restaurant
    const totals = calculateOrderTotals(cart)

    // Validate restaurant ID before submission
    const restaurantId = parseInt(restaurant.id, 10)
    if (Number.isNaN(restaurantId)) {
      setSubmitError('Invalid restaurant. Please try again.')
      hasSubmittedRef.current = false
      return
    }

    // Validate all menu item IDs
    const orderItems = items.map((item) => {
      const menuItemId = parseInt(item.id, 10)
      if (Number.isNaN(menuItemId)) {
        throw new Error(`Invalid menu item: ${item.name}`)
      }
      return { menu_item_id: menuItemId, quantity: item.quantity }
    })

    // Submit order to backend
    const submitOrder = async () => {
      setIsSubmitting(true)
      setSubmitError(null)

      try {
        const response = await orderApi.create({
          restaurant_id: restaurantId,
          guest_phone: delivery.contactPhone,
          items: orderItems,
          tip_amount: totals.tipCents / 100, // Convert to dollars
          delivery_address: {
            building_number: delivery.buildingNumber,
            street_name: delivery.streetName,
            apartment: delivery.apartment,
            city: delivery.city,
            state: delivery.state,
            zip_code: delivery.zipCode,
          },
          delivery_contact_name: delivery.contactName,
          delivery_contact_phone: delivery.contactPhone,
          payment: {
            card_type: payment.cardType,
            card_last_four: payment.cardLastFour,
            card_display: payment.cardDisplay,
            cardholder_first_name: payment.cardholderFirstName,
            cardholder_last_name: payment.cardholderLastName,
            card_expiry: payment.cardExpiry,
          },
          billing_address: {
            building: billing.building,
            street: billing.street,
            apartment: billing.apartment,
            city: billing.city,
            state: billing.state,
            zip: billing.zip,
          },
        })

        // Create snapshot with real order data
        // Backend returns estimated_delivery_time as "45 minutes" string, so we calculate actual time
        const placedAt = new Date()
        const estimatedMinutes = parseInt(response.estimated_delivery_time, 10) || 45
        const estimatedDeliveryTime = new Date(placedAt.getTime() + estimatedMinutes * 60 * 1000)

        setSnapshot({
          orderNumber: response.order_number,
          placedAt,
          estimatedDeliveryTime,
          restaurantName: restaurant.name,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            priceCents: item.priceCents,
            subtotalCents: item.priceCents * item.quantity,
          })),
          totals: {
            ...totals,
            grandTotalCents: Math.round(response.grand_total * 100), // Backend returns dollars
          },
          delivery,
        })

        // Clear cart only after successful submission
        clearCart(restaurant.slug)
      } catch (err) {
        console.error('Failed to submit order:', err)
        setSubmitError(
          err instanceof Error ? err.message : 'Failed to place order. Please try again.'
        )
        hasSubmittedRef.current = false // Allow retry
      } finally {
        setIsSubmitting(false)
      }
    }

    submitOrder()
  }, [cart, clearCart, restaurantSlug, router, snapshot])

  const totals = snapshot?.totals

  const orderTotals = useMemo(() => {
    if (!totals) {
      return null
    }
    return [
      {
        label: 'Subtotal',
        value: formatCurrency(totals.subtotalCents),
      },
      {
        label: 'Service charge (8.25%)',
        value: formatCurrency(totals.serviceChargeCents),
      },
      {
        label: 'Tip',
        value: formatCurrency(totals.tipCents),
      },
      {
        label: 'Total charged',
        value: formatCurrency(totals.grandTotalCents),
        emphasize: true,
      },
    ]
  }, [totals])

  // Show error state
  if (submitError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Order Failed</CardTitle>
          </div>
          <CardDescription>{submitError}</CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/')}>
            Back to restaurants
          </Button>
          <Button onClick={() => {
            setSubmitError(null)
            hasSubmittedRef.current = false
            // Trigger re-submission by forcing a re-render
            setSnapshot(null)
          }}>
            Try again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  // Show loading state
  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{isSubmitting ? 'Placing your order…' : 'Wrapping things up…'}</CardTitle>
          <CardDescription>
            {isSubmitting
              ? 'Please wait while we confirm your order with the restaurant.'
              : 'Hold tight while we finalize your order.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')} disabled={isSubmitting}>
            Back to restaurants
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const deliveryLines = [
    `${snapshot.delivery.buildingNumber} ${snapshot.delivery.streetName}`,
    snapshot.delivery.apartment,
    `${snapshot.delivery.city}, ${snapshot.delivery.state} ${snapshot.delivery.zipCode}`,
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
              <p className="text-sm font-medium text-neutral-600">Estimated delivery</p>
              <p className="text-lg font-semibold text-neutral-900">
                {timeFormatter.format(snapshot.estimatedDeliveryTime)}
              </p>
              <p className="text-xs text-neutral-500">
                We&apos;ll notify you when the driver is on your block.
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
                {deliveryLines.map((line, index) => (
                  <p key={index}>{line}</p>
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
                      {formatCurrency(item.priceCents)} each
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-neutral-900">×{item.quantity}</p>
                    <p className="text-xs text-neutral-500">
                      {formatCurrency(item.subtotalCents)}
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
