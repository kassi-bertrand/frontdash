'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import Image from 'next/image'

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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const PHONE_DIGITS = 10

const DEFAULT_HOURS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
].map((day) => ({ day, open: '', close: '', closed: false }))

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

type Availability = 'AVAILABLE' | 'UNAVAILABLE'

type MenuDraft = {
  name: string
  picture: File | null
  price: string
  availability: Availability
}

type RestaurantDraft = {
  name: string
  picture: File | null
  buildingNumber: string
  streetName: string
  city: string
  state: string
  phones: string[]
  contactPerson: string
  email: string
  hours: Array<{ day: string; open: string; close: string; closed: boolean }>
  menu: MenuDraft[]
}

const createInitialState = (): RestaurantDraft => ({
  name: '',
  picture: null,
  buildingNumber: '',
  streetName: '',
  city: '',
  state: '',
  phones: [''],
  contactPerson: '',
  email: '',
  hours: DEFAULT_HOURS.map((entry) => ({ ...entry })),
  menu: [
    {
      name: '',
      picture: null,
      price: '',
      availability: 'AVAILABLE',
    },
  ],
})

type FieldErrors = Record<string, string>

type FilePreviewProps = {
  file: File
  alt: string
  className?: string
}

function FilePreview({ file, alt, className }: FilePreviewProps) {
  const previewUrl = useMemo(() => URL.createObjectURL(file), [file])

  return (
    <Image
      src={previewUrl}
      alt={alt}
      width={88}
      height={88}
      className={cn('h-16 w-16 rounded-xl object-cover', className)}
      onLoad={() => URL.revokeObjectURL(previewUrl)}
      unoptimized
    />
  )
}

const steps = [
  {
    title: 'Restaurant profile',
    description: 'Contact information and pickup address',
  },
  {
    title: 'Operating hours',
    description: 'Set availability for every day of the week',
  },
  {
    title: 'Submit for approval',
    description: 'Review and send your registration request',
  },
]

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const sanitizePhone = (value: string) =>
  value.replace(/[^0-9]/g, '').slice(0, PHONE_DIGITS)

const formatPhone = (digits: string) => {
  if (!digits) return ''
  if (digits.length <= 3) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

export default function RegisterRestaurant() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<RestaurantDraft>(() => createInitialState())
  const [errors, setErrors] = useState<FieldErrors>({})
  const [phoneErrors, setPhoneErrors] = useState<string[]>([''])
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setForm(createInitialState())
    setErrors({})
    setPhoneErrors([''])
    setStep(0)
    setSubmitted(false)
  }

  const handleFieldChange = (field: keyof RestaurantDraft, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handlePictureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    handleFieldChange('picture', file)
  }

  const handlePhoneChange = (index: number, rawValue: string) => {
    const digits = sanitizePhone(rawValue)
    const formatted = formatPhone(digits)

    const nextPhones = [...form.phones]
    nextPhones[index] = formatted
    handleFieldChange('phones', nextPhones)

    const nextErrors = [...phoneErrors]
    if (!digits) {
      nextErrors[index] = 'Phone is required.'
    } else if (digits.startsWith('0')) {
      nextErrors[index] = 'Phone cannot start with 0.'
    } else if (digits.length !== PHONE_DIGITS) {
      nextErrors[index] = 'Enter all 10 digits.'
    } else {
      nextErrors[index] = ''
    }
    setPhoneErrors(nextErrors)
  }

  const addPhone = () => {
    handleFieldChange('phones', [...form.phones, ''])
    setPhoneErrors((prev) => [...prev, ''])
  }

  const removePhone = (index: number) => {
    if (form.phones.length === 1) return
    handleFieldChange(
      'phones',
      form.phones.filter((_, i) => i !== index),
    )
    setPhoneErrors((prev) => prev.filter((_, i) => i !== index))
  }

  const handleHoursChange = (
    index: number,
    field: 'open' | 'close' | 'closed',
    value: string | boolean,
  ) => {
    const nextHours = [...form.hours]
    if (field === 'closed') {
      const closed = value as boolean
      nextHours[index].closed = closed
      if (closed) {
        nextHours[index].open = ''
        nextHours[index].close = ''
      }
    } else {
      nextHours[index][field] = value as string
    }
    handleFieldChange('hours', nextHours)
  }

  const applyWeekdayHours = () => {
    const [monday] = form.hours
    if (!monday) return

    const updated = form.hours.map((entry, index) => {
      if (index === 0) return entry
      if (index >= 1 && index <= 4) {
        return {
          ...entry,
          closed: monday.closed,
          open: monday.closed ? '' : monday.open,
          close: monday.closed ? '' : monday.close,
        }
      }
      return entry
    })

    handleFieldChange('hours', updated)
  }

  const validateStep = (currentStep: number) => {
    const stepErrors: FieldErrors = {}

    if (currentStep === 0) {
      if (!form.name.trim()) stepErrors.name = 'Restaurant name is required.'
      if (!form.contactPerson.trim())
        stepErrors.contactPerson = 'Contact person is required.'

      if (!form.email.trim()) {
        stepErrors.email = 'Email is required.'
      } else if (!emailPattern.test(form.email.trim())) {
        stepErrors.email = 'Enter a valid email address.'
      }

      if (!form.buildingNumber.trim()) {
        stepErrors.buildingNumber = 'Building number is required.'
      }
      if (!form.streetName.trim()) {
        stepErrors.streetName = 'Street name is required.'
      }
      if (!form.city.trim()) {
        stepErrors.city = 'City is required.'
      }

      const state = form.state.trim().toUpperCase()
      if (!state) {
        stepErrors.state = 'State is required.'
      } else if (!US_STATES.has(state)) {
        stepErrors.state = 'Use a valid two-letter U.S. state abbreviation.'
      } else if (state !== form.state) {
        handleFieldChange('state', state)
      }

      const digitsForPhones = form.phones.map((phone) => sanitizePhone(phone))
      if (digitsForPhones.some((digits) => !digits)) {
        stepErrors.phones = 'At least one phone number is required.'
      }
      if (digitsForPhones.some((digits) => digits.startsWith('0'))) {
        stepErrors.phones = 'Phone numbers cannot start with 0.'
      }
      if (digitsForPhones.some((digits) => digits.length !== PHONE_DIGITS)) {
        stepErrors.phones = 'Each phone number must contain 10 digits.'
      }
    }

    if (currentStep === 1) {
      const invalidDay = form.hours.find((hour) => {
        if (hour.closed) return false
        if (!hour.open || !hour.close) return true
        return hour.open >= hour.close
      })

      if (invalidDay) {
        stepErrors.hours = `Set valid opening hours for ${invalidDay.day}.`
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const goToNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }

  const goToPrevious = () => setStep((prev) => Math.max(prev - 1, 0))

  const handleSubmit = () => {
    if (!validateStep(1)) {
      setStep(1)
      return
    }

    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitted(true)
    }, 1200)
  }

  const renderStepIndicator = () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-rose-500">
        <span>Step {step + 1}</span>
        <span>{steps.length} total</span>
      </div>
      <div className="flex overflow-hidden rounded-full bg-rose-100">
        <div
          className="h-2 rounded-full bg-rose-500 transition-all"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-neutral-900">{steps[step].title}</h2>
        <p className="text-sm text-neutral-500">{steps[step].description}</p>
      </div>
    </div>
  )

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 py-16">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 text-center">
          <Badge className="mx-auto w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1 text-sm font-semibold text-emerald-700">
            Registration pending review
          </Badge>
          <Card className="border border-neutral-200 bg-white/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-neutral-900">
                Thanks for registering!
              </CardTitle>
              <CardDescription className="text-base text-neutral-600">
                We’ve routed your application to the FrontDash admin team. Expect an email
                with credentials after approval.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-600">
              <p>
                Need to make changes? You can resubmit the form at any time before
                approval. A staff member will reach out if anything looks off.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={resetForm}>
                Register another restaurant
              </Button>
              <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Back to homepage
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 py-16">
      <div className="mx-auto w-full max-w-4xl px-6">
        <div className="mb-8 space-y-2 text-center">
          <Badge className="rounded-full border border-rose-200 bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Restaurant onboarding
          </Badge>
          <h1 className="text-3xl font-semibold text-neutral-900 sm:text-4xl">
            Join the FrontDash marketplace
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-neutral-600">
            Tell us about your restaurant, set your weekly hours, and submit your details
            for approval. Once the FrontDash team reviews your request, we’ll send
            credentials so you can start managing your menu.
          </p>
        </div>

        <Card className="border border-neutral-200 bg-white/95 shadow-xl">
          <CardHeader className="border-b border-neutral-200 bg-neutral-50/60">
            {renderStepIndicator()}
          </CardHeader>

          <CardContent className="space-y-8 p-6">
            {step === 0 ? (
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Basic details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-name">Restaurant name *</Label>
                      <Input
                        id="restaurant-name"
                        value={form.name}
                        onChange={(event) =>
                          handleFieldChange('name', event.target.value)
                        }
                        placeholder="Rosemary & Thyme Bistro"
                        aria-invalid={Boolean(errors.name)}
                      />
                      {errors.name ? (
                        <p className="text-xs text-red-600">{errors.name}</p>
                      ) : (
                        <p className="text-xs text-neutral-500">
                          We’ll check name uniqueness during admin review.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="restaurant-picture">
                        Restaurant picture (optional)
                      </Label>
                      <label
                        htmlFor="restaurant-picture"
                        className="flex h-32 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 text-xs font-medium text-neutral-500 hover:border-neutral-400"
                      >
                        {form.picture ? (
                          <FilePreview
                            file={form.picture}
                            alt={form.name || 'Restaurant'}
                          />
                        ) : (
                          <span>Click to upload JPG or PNG</span>
                        )}
                      </label>
                      <input
                        id="restaurant-picture"
                        type="file"
                        accept="image/*"
                        onChange={handlePictureUpload}
                        className="sr-only"
                      />
                    </div>
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Pickup address
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)]">
                    <div className="space-y-2">
                      <Label htmlFor="building-number">Building number *</Label>
                      <Input
                        id="building-number"
                        value={form.buildingNumber}
                        onChange={(event) =>
                          handleFieldChange('buildingNumber', event.target.value)
                        }
                        placeholder="123"
                        aria-invalid={Boolean(errors.buildingNumber)}
                      />
                      {errors.buildingNumber && (
                        <p className="text-xs text-red-600">{errors.buildingNumber}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="street-name">Street name *</Label>
                      <Input
                        id="street-name"
                        value={form.streetName}
                        onChange={(event) =>
                          handleFieldChange('streetName', event.target.value)
                        }
                        placeholder="Market Street"
                        aria-invalid={Boolean(errors.streetName)}
                      />
                      {errors.streetName && (
                        <p className="text-xs text-red-600">{errors.streetName}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(event) =>
                          handleFieldChange('city', event.target.value)
                        }
                        placeholder="San Francisco"
                        aria-invalid={Boolean(errors.city)}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-600">{errors.city}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State *</Label>
                      <Input
                        id="state"
                        value={form.state}
                        onChange={(event) =>
                          handleFieldChange(
                            'state',
                            event.target.value
                              .toUpperCase()
                              .replace(/[^A-Z]/g, '')
                              .slice(0, 2),
                          )
                        }
                        placeholder="CA"
                        aria-invalid={Boolean(errors.state)}
                      />
                      <p
                        className={cn(
                          'text-xs',
                          errors.state ? 'text-red-600' : 'text-neutral-500',
                        )}
                      >
                        {errors.state || 'Two-letter U.S. abbreviation'}
                      </p>
                    </div>
                    <div className="hidden sm:block" />
                  </div>
                </section>

                <Separator />

                <section className="space-y-4">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Primary contacts
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="contact-person">Contact person *</Label>
                      <Input
                        id="contact-person"
                        value={form.contactPerson}
                        onChange={(event) =>
                          handleFieldChange('contactPerson', event.target.value)
                        }
                        placeholder="Jordan Ellis"
                        aria-invalid={Boolean(errors.contactPerson)}
                      />
                      {errors.contactPerson && (
                        <p className="text-xs text-red-600">{errors.contactPerson}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address *</Label>
                      <Input
                        id="email"
                        value={form.email}
                        onChange={(event) =>
                          handleFieldChange('email', event.target.value)
                        }
                        placeholder="owner@roseandthyme.com"
                        aria-invalid={Boolean(errors.email)}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-600">{errors.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Phone numbers *</Label>
                      <Button variant="outline" size="sm" onClick={addPhone}>
                        Add number
                      </Button>
                    </div>
                    <div className="space-y-3">
                      {form.phones.map((phone, index) => (
                        <div key={index} className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <Input
                              value={phone}
                              onChange={(event) =>
                                handlePhoneChange(index, event.target.value)
                              }
                              placeholder="(415) 867-5309"
                              aria-invalid={Boolean(phoneErrors[index])}
                            />
                            {form.phones.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-neutral-500 hover:text-red-600"
                                onClick={() => removePhone(index)}
                                aria-label="Remove phone"
                              >
                                ×
                              </Button>
                            )}
                          </div>
                          {phoneErrors[index] && (
                            <p className="text-xs text-red-600">{phoneErrors[index]}</p>
                          )}
                        </div>
                      ))}
                      {errors.phones && (
                        <p className="text-xs text-red-600">{errors.phones}</p>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-neutral-600">
                    Set your opening hours for each day. Mark a day as closed to skip
                    start and end times.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={applyWeekdayHours}
                    className="w-full sm:w-auto"
                  >
                    Apply Monday hours to weekdays
                  </Button>
                </div>
                {form.hours.map((hour, index) => (
                  <div
                    key={hour.day}
                    className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-900">{hour.day}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Switch
                          checked={!hour.closed}
                          onCheckedChange={(checked) =>
                            handleHoursChange(index, 'closed', !checked)
                          }
                        />
                        <span>{hour.closed ? 'Closed for customers' : 'Open'} </span>
                      </div>
                    </div>
                    {!hour.closed ? (
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <div className="space-y-1">
                          <Label htmlFor={`open-${hour.day}`}>Opens</Label>
                          <Input
                            id={`open-${hour.day}`}
                            type="time"
                            value={hour.open}
                            onChange={(event) =>
                              handleHoursChange(index, 'open', event.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`close-${hour.day}`}>Closes</Label>
                          <Input
                            id={`close-${hour.day}`}
                            type="time"
                            value={hour.close}
                            onChange={(event) =>
                              handleHoursChange(index, 'close', event.target.value)
                            }
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
                {errors.hours && <p className="text-xs text-red-600">{errors.hours}</p>}
              </div>
            ) : null}

            {step === 2 ? (
              <div className="space-y-6">
                <section className="space-y-2">
                  <h3 className="text-lg font-semibold text-neutral-900">
                    Review before you submit
                  </h3>
                  <p className="text-sm text-neutral-600">
                    FrontDash reviews every application within two business days. If
                    everything looks good, you’ll receive credentials via email.
                  </p>
                </section>

                <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold text-neutral-900">
                      {form.name || 'Restaurant name'}
                    </p>
                    <p className="text-neutral-600">
                      {form.buildingNumber} {form.streetName}, {form.city}{' '}
                      {form.state && `(${form.state})`}
                    </p>
                  </div>
                  <div className="text-sm text-neutral-600">
                    <p className="font-semibold text-neutral-900">Primary contact</p>
                    <p>{form.contactPerson}</p>
                    <p>{form.email}</p>
                    <p>
                      {form.phones.map((phone) => (
                        <span key={phone} className="mr-2">
                          {phone}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">
                      Hours snapshot
                    </p>
                    <ul className="mt-2 grid gap-1 text-xs text-neutral-600 sm:grid-cols-2">
                      {form.hours.map((hour) => (
                        <li key={hour.day}>
                          <span className="font-medium text-neutral-900">
                            {hour.day}:
                          </span>{' '}
                          {hour.closed
                            ? 'Closed'
                            : `${hour.open || '—'} to ${hour.close || '—'}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50/60 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-neutral-500">
              {step < steps.length - 1
                ? 'You can revisit details before submitting for review.'
                : 'Submitting will queue this registration for admin approval.'}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={step === 0 ? undefined : goToPrevious}
                disabled={step === 0}
              >
                Back
              </Button>
              {step < steps.length - 1 ? (
                <Button className="w-full sm:w-auto" onClick={goToNext}>
                  Continue
                </Button>
              ) : (
                <Button
                  className="w-full sm:w-auto"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending…' : 'Submit for approval'}
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
