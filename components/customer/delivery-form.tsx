'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

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
import { useCartStore, type DeliveryDetails } from '@/stores/use-cart-store'
import { calculateOrderTotals, emptyOrderTotals } from '@/lib/checkout-utils'

// Format helpers keep the inputs resilient while guests type.
const phoneDigits = (value: string) => value.replace(/[^0-9]/g, '')
const formatCurrency = (cents: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    cents / 100,
  )

export type DeliveryFormProps = {
  restaurantSlug: string
}

// Whitelist of U.S. state abbreviations—keeps validation deterministic without
// adding a full dropdown.
const US_STATES = new Set([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
  'DC',
])

export function DeliveryForm({ restaurantSlug }: DeliveryFormProps) {
  const router = useRouter()
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])
  const setDelivery = useCartStore((state) => state.setDelivery)

  const [buildingNumber, setBuildingNumber] = useState('')
  const [streetName, setStreetName] = useState('')
  const [apartment, setApartment] = useState('')
  const [city, setCity] = useState('')
  const [stateValue, setStateValue] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (!cart?.delivery) {
      return
    }

    const delivery = cart.delivery
    setBuildingNumber(delivery.buildingNumber)
    setStreetName(delivery.streetName)
    setApartment(delivery.apartment ?? '')
    setCity(delivery.city)
    setStateValue(delivery.state.toUpperCase())
    setZipCode(delivery.zipCode ?? '')
    setContactName(delivery.contactName)
    setContactPhone(delivery.contactPhone)
  }, [cart?.delivery])

  const orderSummary = useMemo(() => {
    return cart ? calculateOrderTotals(cart) : emptyOrderTotals()
  }, [cart])

  if (!cart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start an order first</CardTitle>
          <CardDescription>
            Add items to your cart before you continue to delivery details.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')}>Back to restaurants</Button>
        </CardFooter>
      </Card>
    )
  }

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    setContactPhone(phoneDigits(event.target.value).slice(0, 10))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage(null)
    setIsSaved(false)

    if (!buildingNumber.trim()) {
      setErrorMessage('Building number is required.')
      return
    }

    if (!streetName.trim()) {
      setErrorMessage('Street name is required.')
      return
    }

    if (!city.trim()) {
      setErrorMessage('City is required.')
      return
    }

    const upperState = stateValue.trim().toUpperCase()

    if (!upperState) {
      setErrorMessage('State is required.')
      return
    }

    if (!US_STATES.has(upperState)) {
      setErrorMessage('Enter a valid two-letter U.S. state abbreviation.')
      return
    }

    const trimmedZip = zipCode.trim()
    if (!trimmedZip || !/^\d{5}(-\d{4})?$/.test(trimmedZip)) {
      setErrorMessage('Enter a valid 5-digit ZIP code (e.g., 94102).')
      return
    }

    if (contactName.trim().length < 2) {
      setErrorMessage('Enter a valid contact name (at least two letters).')
      return
    }

    if (contactPhone.length !== 10) {
      setErrorMessage('Contact phone must be 10 digits.')
      return
    }

    const deliveryPayload: DeliveryDetails = {
      buildingNumber: buildingNumber.trim(),
      streetName: streetName.trim(),
      apartment: apartment.trim() || undefined,
      city: city.trim(),
      state: upperState,
      zipCode: trimmedZip,
      contactName: contactName.trim(),
      contactPhone,
    }

    setDelivery({ restaurantSlug, delivery: deliveryPayload })
    setIsSaved(true)
    router.push(`/order/confirmation/${restaurantSlug}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery details</CardTitle>
        <CardDescription>
          Provide the drop-off location so the driver knows exactly where to go.
        </CardDescription>
      </CardHeader>
      <form noValidate onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-[minmax(0,160px)_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="building-number">Building number</Label>
              <Input
                id="building-number"
                value={buildingNumber}
                onChange={(event) => setBuildingNumber(event.target.value)}
                placeholder="123"
                autoComplete="shipping street-address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="street-name">Street name</Label>
              <Input
                id="street-name"
                value={streetName}
                onChange={(event) => setStreetName(event.target.value)}
                placeholder="Market Street"
                autoComplete="shipping address-line1"
              />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="apartment">Apt / Unit (optional)</Label>
              <Input
                id="apartment"
                value={apartment}
                onChange={(event) => setApartment(event.target.value)}
                placeholder="Suite 200"
                autoComplete="shipping address-line2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                placeholder="San Francisco"
                autoComplete="shipping address-level2"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={stateValue}
                onChange={(event) =>
                  setStateValue(
                    event.target.value
                      .toUpperCase()
                      .replace(/[^A-Z]/g, '')
                      .slice(0, 2),
                  )
                }
                placeholder="CA"
                autoComplete="shipping address-level1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip-code">ZIP Code</Label>
              <Input
                id="zip-code"
                value={zipCode}
                onChange={(event) =>
                  setZipCode(event.target.value.replace(/[^0-9-]/g, '').slice(0, 10))
                }
                placeholder="94102"
                inputMode="numeric"
                autoComplete="shipping postal-code"
              />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,240px)]">
            <div className="space-y-2">
              <Label htmlFor="contact-name">Contact name</Label>
              <Input
                id="contact-name"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                placeholder="Alex Chen"
                autoComplete="shipping name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                value={contactPhone}
                onChange={handlePhoneChange}
                placeholder="5551234567"
                inputMode="numeric"
                autoComplete="shipping tel"
              />
              <p className="text-xs text-neutral-500">
                Digits only; the driver calls this number on arrival.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-700">Order summary</h3>
            <dl className="mt-3 space-y-2 text-sm text-neutral-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(orderSummary.subtotalCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Service charge (8.25%)</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(orderSummary.serviceChargeCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tip</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(orderSummary.tipCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                <dt>Total charged</dt>
                <dd>{formatCurrency(orderSummary.grandTotalCents)}</dd>
              </div>
            </dl>
          </section>

          {errorMessage ? (
            <p className="text-sm font-medium text-red-600">{errorMessage}</p>
          ) : null}

          {isSaved ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Redirecting to order confirmation…
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="mt-4 flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/payment/${restaurantSlug}`)}
          >
            Back to payment
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            Save & continue
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
