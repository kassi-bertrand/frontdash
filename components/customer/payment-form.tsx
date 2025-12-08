'use client'

import { useMemo, useState } from 'react'
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCartStore } from '@/stores/use-cart-store'
import { calculateOrderTotals, emptyOrderTotals } from '@/lib/checkout-utils'

const cardOptions = ['VISA', 'MasterCard', 'Discover', 'American Express'] as const
type CardType = (typeof cardOptions)[number]

const CARD_RULES: Record<
  CardType,
  { lengths: number[]; pattern: RegExp; label: string; sample: string }
> = {
  // Visa test numbers: 4242 4242 4242 4242
  VISA: {
    lengths: [16],
    pattern: /^4\d{15}$/,
    label: 'Visa',
    sample: '4242 4242 4242 4242',
  },
  // Mastercard test numbers: 5555 5555 5555 4444
  MasterCard: {
    lengths: [16],
    pattern: /^(5[1-5]\d{14}|2[2-7]\d{14})$/,
    label: 'Mastercard',
    sample: '5555 5555 5555 4444',
  },
  // Discover test numbers: 6011 1111 1111 1117
  Discover: {
    lengths: [16],
    pattern: /^(6011\d{12}|65\d{14}|64[4-9]\d{13})$/,
    label: 'Discover',
    sample: '6011 1111 1111 1117',
  },
  // American Express test numbers: 3782 822463 10005
  'American Express': {
    lengths: [15],
    pattern: /^3[47]\d{13}$/,
    label: 'American Express',
    sample: '3782 822463 10005',
  },
}

type PaymentFormProps = {
  restaurantSlug: string
}

// Remove spaces or stray characters while the guest types.
const sanitizeCardNumber = (value: string) => value.replace(/[^0-9]/g, '')

// Format card numbers with spaces every 4 digits to improve readability and
// match most card designs.
const formatCardNumberForType = (digits: string, type: CardType) => {
  const maxDigits = Math.max(...CARD_RULES[type].lengths)
  const trimmed = digits.slice(0, maxDigits)
  return trimmed.replace(/(.{4})/g, '$1 ').trim()
}

// Luhn checksum keeps obviously invalid numbers (typos, wrong prefixes) from
// slipping past the mocked verification step.
const passesLuhnCheck = (digits: string) => {
  let sum = 0
  let shouldDouble = false

  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number.parseInt(digits[i] ?? '0', 10)

    if (Number.isNaN(digit)) {
      return false
    }

    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

export function PaymentForm({ restaurantSlug }: PaymentFormProps) {
  const router = useRouter()
  const cart = useCartStore((state) => state.cartsByRestaurant[restaurantSlug])
  const [cardType, setCardType] = useState<CardType>('VISA')
  const [cardNumber, setCardNumber] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [billingAddress, setBillingAddress] = useState('')
  const [expiryMonth, setExpiryMonth] = useState('')
  const [expiryYear, setExpiryYear] = useState('')
  const [securityCode, setSecurityCode] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const maxDigitsForType = useMemo(
    () => Math.max(...CARD_RULES[cardType].lengths),
    [cardType],
  )

  const formattedMaxLength = useMemo(() => {
    const spaceSlots = Math.ceil(maxDigitsForType / 4) - 1
    return maxDigitsForType + Math.max(spaceSlots, 0)
  }, [maxDigitsForType])

  const cartSummary = useMemo(() => {
    return cart ? calculateOrderTotals(cart) : emptyOrderTotals()
  }, [cart])

  if (!cart) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Start an order first</CardTitle>
          <CardDescription>
            Add items to your cart before you continue to payment.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push('/')}>Back to restaurants</Button>
        </CardFooter>
      </Card>
    )
  }

  const handleCardTypeChange = (value: CardType) => {
    setCardType(value)
    setCardNumber((prev) => formatCardNumberForType(sanitizeCardNumber(prev), value))
  }

  const handleCardNumberChange = (value: string) => {
    const digitsOnly = sanitizeCardNumber(value)
    setCardNumber(formatCardNumberForType(digitsOnly, cardType))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setErrorMessage(null)

    const digitsOnly = sanitizeCardNumber(cardNumber)
    const rule = CARD_RULES[cardType]

    if (!rule.lengths.includes(digitsOnly.length) || !rule.pattern.test(digitsOnly)) {
      setErrorMessage(`Enter a valid ${rule.label} number.`)
      return
    }

    if (!passesLuhnCheck(digitsOnly)) {
      setErrorMessage('Card number failed validation. Check the digits and try again.')
      return
    }

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setErrorMessage('Enter a valid cardholder name (at least two letters each).')
      return
    }

    if (!billingAddress.trim()) {
      setErrorMessage('Billing address is required.')
      return
    }

    if (!/^(0[1-9]|1[0-2])$/.test(expiryMonth) || !/^\d{2}$/.test(expiryYear)) {
      setErrorMessage('Expiry must be MM/YY.')
      return
    }

    if (!/^\d{3}$/.test(securityCode)) {
      setErrorMessage('Security code must be 3 digits.')
      return
    }

    setIsVerifying(true)

    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsVerifying(false)

    // STORY-C007 will introduce the delivery details route. Redirect there once
    // the mocked verification passes so the flow mirrors the full project spec.
    router.push(`/delivery/${restaurantSlug}`)
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay with credit card</CardTitle>
        <CardDescription>
          All fields are required before we can verify your payment details.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit} noValidate>
        <CardContent className="space-y-6">
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-medium text-neutral-700">Card type</h2>
              <p className="text-xs text-neutral-500">
                Select the network printed on the front of your card.
              </p>
            </div>
            <RadioGroup
              value={cardType}
              onValueChange={(value) => handleCardTypeChange(value as CardType)}
              className="grid gap-3 sm:grid-cols-2"
            >
              {cardOptions.map((option) => (
                <Label
                  key={option}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition hover:border-neutral-400 has-[[data-state=checked]]:border-neutral-900 has-[[data-state=checked]]:shadow-md"
                >
                  <RadioGroupItem value={option} id={`card-${option}`} />
                  <span className="text-sm font-medium text-neutral-800">{option}</span>
                </Label>
              ))}
            </RadioGroup>
          </section>

          <section className="space-y-3">
            <Label htmlFor="card-number">Card number</Label>
            <Input
              id="card-number"
              inputMode="numeric"
              maxLength={formattedMaxLength}
              placeholder={
                cardType === 'American Express'
                  ? '3782 822463 10005'
                  : '1234 5678 9012 3456'
              }
              value={cardNumber}
              onChange={(event) => handleCardNumberChange(event.target.value)}
            />
            <p className="text-xs text-neutral-500">
              {cardType === 'American Express'
                ? 'American Express numbers contain 15 digits and start with 34 or 37.'
                : `${CARD_RULES[cardType].label} numbers contain 16 digits and follow standard network prefixes.`}
            </p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="first-name">Cardholder first name</Label>
              <Input
                id="first-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jane"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last-name">Cardholder last name</Label>
              <Input
                id="last-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Doe"
              />
            </div>
          </section>

          <section className="space-y-2">
            <Label htmlFor="billing-address">Billing address</Label>
            <Input
              id="billing-address"
              value={billingAddress}
              onChange={(event) => setBillingAddress(event.target.value)}
              placeholder="123 Market Street, Suite 200, San Francisco, CA"
            />
          </section>

          <section className="grid gap-4 sm:grid-cols-[repeat(3,minmax(0,1fr))]">
            <div className="space-y-2">
              <Label htmlFor="expiry-month">Expiry month</Label>
              <Input
                id="expiry-month"
                placeholder="MM"
                inputMode="numeric"
                maxLength={2}
                value={expiryMonth}
                onChange={(event) =>
                  setExpiryMonth(event.target.value.replace(/[^0-9]/g, ''))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-year">Expiry year</Label>
              <Input
                id="expiry-year"
                placeholder="YY"
                inputMode="numeric"
                maxLength={2}
                value={expiryYear}
                onChange={(event) =>
                  setExpiryYear(event.target.value.replace(/[^0-9]/g, ''))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="security-code">Security code</Label>
              <Input
                id="security-code"
                placeholder="CVC"
                inputMode="numeric"
                maxLength={3}
                value={securityCode}
                onChange={(event) =>
                  setSecurityCode(event.target.value.replace(/[^0-9]/g, ''))
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-700">Order summary</h3>
            <dl className="mt-3 space-y-2 text-sm text-neutral-600">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(cartSummary.subtotalCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Service charge (8.25%)</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(cartSummary.serviceChargeCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt>Tip</dt>
                <dd className="font-medium text-neutral-900">
                  {formatCurrency(cartSummary.tipCents)}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
                <dt>Total charged today</dt>
                <dd>{formatCurrency(cartSummary.grandTotalCents)}</dd>
              </div>
            </dl>
          </section>

          {errorMessage ? (
            <p className="text-sm font-medium text-red-600">{errorMessage}</p>
          ) : null}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 border-t border-neutral-200 pt-6 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push(`/checkout/${restaurantSlug}`)}
          >
            Back to order
          </Button>
          <Button type="submit" className="w-full sm:w-auto" disabled={isVerifying}>
            {isVerifying ? 'Verifying card…' : 'Verify & continue'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
