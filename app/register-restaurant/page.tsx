'use client'

/**
 * Restaurant Registration Page
 *
 * Multi-step registration form for new restaurants to join FrontDash.
 *
 * Flow:
 * 1. Basic details: name, address, contact info
 * 2. Operating hours: set hours for each day of the week
 * 3. Menu items: add initial menu with prices and images
 * 4. Review & submit: sends data to backend API
 *
 * On successful registration:
 * - Restaurant record created with status='PENDING'
 * - Auto-generated credentials returned to user
 * - Operating hours and menu items created
 * - Images uploaded to S3 (if provided)
 * - Admin must approve before restaurant can log in
 */

import { ChangeEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'

import { restaurantApi, uploadApi, hoursApi, menuApi, ApiError, type OperatingHours } from '@/lib/api'

type DayOfWeek = OperatingHours['day_of_week']

const DAY_NAME_TO_API: Record<string, DayOfWeek> = {
  Monday: 'MONDAY',
  Tuesday: 'TUESDAY',
  Wednesday: 'WEDNESDAY',
  Thursday: 'THURSDAY',
  Friday: 'FRIDAY',
  Saturday: 'SATURDAY',
  Sunday: 'SUNDAY',
}

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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { MenuPlaceholder } from '@/components/customer/menu-placeholder'

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
  description: string
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
  zipCode: string
  phone: string
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
  zipCode: '',
  phone: '',
  contactPerson: '',
  email: '',
  hours: DEFAULT_HOURS.map((entry) => ({ ...entry })),
  menu: [
    {
      name: '',
      picture: null,
      description: '',
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  if (!previewUrl) return null

  return (
    <img
      src={previewUrl}
      alt={alt}
      className={cn('h-16 w-16 rounded-xl object-cover', className)}
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
    title: 'Menu items',
    description: 'Add dishes you want customers to see first',
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
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [credentials, setCredentials] = useState<{
    username: string
    password: string
  } | null>(null)

  const resetForm = () => {
    setForm(createInitialState())
    setErrors({})
    setStep(0)
    setSubmitted(false)
    setCredentials(null)
  }

  const handleFieldChange = <K extends keyof RestaurantDraft>(
    field: K,
    value: RestaurantDraft[K],
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleMenuChange = (
    index: number,
    field: keyof MenuDraft,
    value: string | File | null,
  ) => {
    const nextMenu = [...form.menu]
    nextMenu[index] = {
      ...nextMenu[index],
      [field]: value,
    }
    handleFieldChange('menu', nextMenu)
  }

  const addMenuItem = () => {
    handleFieldChange('menu', [
      ...form.menu,
      { name: '', picture: null, description: '', price: '', availability: 'AVAILABLE' },
    ])
  }

  const removeMenuItem = (index: number) => {
    if (form.menu.length === 1) return
    handleFieldChange(
      'menu',
      form.menu.filter((_, i) => i !== index),
    )
  }

  const handlePictureUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    handleFieldChange('picture', file)
  }

  const handlePhoneChange = (rawValue: string) => {
    const digits = sanitizePhone(rawValue)
    const formatted = formatPhone(digits)
    handleFieldChange('phone', formatted)
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

      const zipDigits = form.zipCode.replace(/[^0-9]/g, '')
      if (!zipDigits) {
        stepErrors.zipCode = 'ZIP code is required.'
      } else if (zipDigits.length !== 5) {
        stepErrors.zipCode = 'ZIP code must be 5 digits.'
      }

      const phoneDigits = sanitizePhone(form.phone)
      if (!phoneDigits) {
        stepErrors.phone = 'Phone number is required.'
      } else if (phoneDigits.startsWith('0')) {
        stepErrors.phone = 'Phone number cannot start with 0.'
      } else if (phoneDigits.length !== PHONE_DIGITS) {
        stepErrors.phone = 'Phone number must be 10 digits.'
      }
    }

    if (currentStep === 1) {
      const invalidDay = form.hours.find((hour) => {
        if (hour.closed) return false
        if (!hour.open || !hour.close) return true
        return hour.open >= hour.close
      })

      if (invalidDay) {
        if (!invalidDay.open || !invalidDay.close) {
          stepErrors.hours = `${invalidDay.day}: Please set both opening and closing times.`
        } else {
          stepErrors.hours = `${invalidDay.day}: Opening time (${invalidDay.open}) must be before closing time (${invalidDay.close}).`
        }
      }
    }

    if (currentStep === 2) {
      if (form.menu.length === 0) {
        stepErrors.menu = 'Add at least one menu item.'
      }

      form.menu.forEach((item, index) => {
        if (!item.name.trim()) {
          stepErrors[`menu-name-${index}`] = 'Item name is required.'
        }

        const priceValue = Number.parseFloat(item.price)
        if (!item.price || Number.isNaN(priceValue) || priceValue <= 0) {
          stepErrors[`menu-price-${index}`] = 'Enter a valid price.'
        }
      })
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

  const handleSubmit = async () => {
    // Validate all steps before submitting
    for (let stepToValidate = 0; stepToValidate <= 2; stepToValidate++) {
      if (!validateStep(stepToValidate)) {
        setStep(stepToValidate)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Step 1: Register the restaurant
      const registrationPayload = {
        restaurant_name: form.name.trim(),
        owner_name: form.contactPerson.trim(),
        email_address: form.email.trim(),
        street_address: `${form.buildingNumber.trim()} ${form.streetName.trim()}`,
        city: form.city.trim(),
        state: form.state.trim().toUpperCase(),
        zip_code: form.zipCode.trim(),
        phone_number: sanitizePhone(form.phone),
      }

      const result = await restaurantApi.register(registrationPayload)
      const restaurantId = result.restaurant_id

      // Step 2: Upload restaurant image if provided
      if (form.picture) {
        try {
          const imageUrl = await uploadApi.uploadImage('restaurant', restaurantId, form.picture)
          await restaurantApi.update(restaurantId, { restaurant_image_url: imageUrl })
        } catch (uploadError) {
          console.error('Restaurant image upload failed:', uploadError)
          toast.error('Restaurant created, but image upload failed. You can add it later.')
        }
      }

      // Step 3: Create operating hours for each day
      const hoursPromises = form.hours.map((hour) => {
        const dayOfWeek = DAY_NAME_TO_API[hour.day]
        if (!dayOfWeek) {
          throw new Error(`Invalid day of week: ${hour.day}`)
        }

        return hoursApi.updateDay(restaurantId, {
          day_of_week: dayOfWeek,
          opening_time: hour.closed ? null : hour.open,
          closing_time: hour.closed ? null : hour.close,
          is_closed: hour.closed,
        })
      })

      try {
        await Promise.all(hoursPromises)
      } catch (hoursError) {
        console.error('Failed to create operating hours:', hoursError)
        toast.error('Restaurant created, but operating hours setup failed. You can update them later.')
      }

      // Step 4: Create menu items
      let menuItemsFailed = 0
      for (const item of form.menu) {
        if (!item.name.trim()) continue

        try {
          const menuItemResponse = await menuApi.create(restaurantId, {
            item_name: item.name.trim(),
            item_description: item.description.trim() || undefined,
            item_price: parseFloat(item.price),
            availability_status: item.availability,
          })

          // Upload menu item image if provided
          if (item.picture && menuItemResponse.menu_item) {
            try {
              const menuImageUrl = await uploadApi.uploadImage(
                'menu-item',
                menuItemResponse.menu_item.menu_item_id,
                item.picture,
              )
              await menuApi.update(menuItemResponse.menu_item.menu_item_id, {
                item_image_url: menuImageUrl,
              })
            } catch (menuImageError) {
              console.error('Menu item image upload failed:', menuImageError)
              toast.warning(`Image upload failed for "${item.name}". You can add it later.`)
            }
          }
        } catch (menuError) {
          console.error('Failed to create menu item:', menuError)
          menuItemsFailed++
        }
      }

      if (menuItemsFailed > 0) {
        toast.warning(
          `${menuItemsFailed} menu item${menuItemsFailed > 1 ? 's' : ''} could not be created. You can add them after logging in.`,
        )
      }

      // Success - show credentials
      setCredentials({
        username: result.username,
        password: result.temporary_password,
      })
      setSubmitted(true)
      toast.success('Registration submitted successfully!')
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 409) {
          setErrors({ name: 'This restaurant name is already registered.' })
          setStep(0)
          toast.error('Restaurant name already exists. Please choose a different name.')
        } else if (error.status === 400) {
          toast.error(error.message || 'Please fill in all required fields correctly.')
        } else {
          toast.error(error.message || 'Registration failed. Please try again.')
        }
      } else {
        console.error('Registration error:', error)
        toast.error('Registration failed. Please check your connection and try again.')
      }
    } finally {
      setIsSubmitting(false)
    }
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
          <Badge className="mx-auto w-fit rounded-full border border-amber-200 bg-amber-50 px-4 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Registration pending review
          </Badge>
          <Card className="border border-neutral-200 bg-white/90 shadow-xl">
            <CardHeader>
              <CardTitle className="text-3xl font-semibold text-neutral-900">
                Thanks for registering!
              </CardTitle>
              <CardDescription className="text-base text-neutral-600">
                We&apos;ve routed your application to the FrontDash admin team for review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-neutral-600">
              {credentials ? (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-left">
                  <p className="text-sm font-semibold text-neutral-900">
                    Your login credentials
                  </p>
                  <p className="text-xs text-neutral-500">
                    Save these credentials securely. You can log in once an admin approves your registration.
                  </p>
                  <dl className="mt-3 space-y-2 text-sm text-neutral-700">
                    <div className="flex items-center justify-between gap-3">
                      <dt>Username</dt>
                      <dd className="font-mono text-neutral-900">
                        {credentials.username}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Password</dt>
                      <dd className="font-mono text-neutral-900">
                        {credentials.password}
                      </dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-amber-700">
                    Note: A FrontDash administrator will review your application. You&apos;ll be able to log in after approval.
                  </p>
                </div>
              ) : (
                <p>
                  Your application has been submitted. A FrontDash administrator will review it shortly.
                </p>
              )}
            </CardContent>
            <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button variant="outline" onClick={resetForm}>
                Register another restaurant
              </Button>
              <Button asChild>
                <Link href="/">Back to homepage</Link>
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
                    <div className="space-y-2">
                      <Label htmlFor="zip-code">ZIP code *</Label>
                      <Input
                        id="zip-code"
                        value={form.zipCode}
                        onChange={(event) =>
                          handleFieldChange(
                            'zipCode',
                            event.target.value.replace(/[^0-9]/g, '').slice(0, 5),
                          )
                        }
                        placeholder="94102"
                        aria-invalid={Boolean(errors.zipCode)}
                      />
                      {errors.zipCode && (
                        <p className="text-xs text-red-600">{errors.zipCode}</p>
                      )}
                    </div>
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

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone number *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(event) => handlePhoneChange(event.target.value)}
                      placeholder="(415) 867-5309"
                      aria-invalid={Boolean(errors.phone)}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600">{errors.phone}</p>
                    )}
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
                    Add your signature dishes
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Include at least one menu item so customers know what to expect when
                    your restaurant goes live.
                  </p>
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addMenuItem}
                    >
                      Add menu item
                    </Button>
                  </div>
                </section>

                <div className="space-y-4">
                  {form.menu.map((item, index) => (
                    <div
                      key={index}
                      className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
                    >
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`menu-name-${index}`}>Item name *</Label>
                          <Input
                            id={`menu-name-${index}`}
                            value={item.name}
                            onChange={(event) =>
                              handleMenuChange(index, 'name', event.target.value)
                            }
                            placeholder="Lemon herb roasted chicken"
                            aria-invalid={Boolean(errors[`menu-name-${index}`])}
                          />
                          {errors[`menu-name-${index}`] && (
                            <p className="text-xs text-red-600">
                              {errors[`menu-name-${index}`]}
                            </p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`menu-description-${index}`}>
                            Description (optional)
                          </Label>
                          <Textarea
                            id={`menu-description-${index}`}
                            value={item.description}
                            onChange={(event) =>
                              handleMenuChange(index, 'description', event.target.value)
                            }
                            placeholder="Charred lemon, thyme jus, roasted vegetables"
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`menu-price-${index}`}>Price *</Label>
                            <Input
                              id={`menu-price-${index}`}
                              value={item.price}
                              onChange={(event) =>
                                handleMenuChange(index, 'price', event.target.value)
                              }
                              placeholder="12.99"
                              inputMode="decimal"
                              aria-invalid={Boolean(errors[`menu-price-${index}`])}
                            />
                            <p className="text-xs text-neutral-500">
                              In dollars (e.g., 12.99 or 15)
                            </p>
                            {errors[`menu-price-${index}`] && (
                              <p className="text-xs text-red-600">
                                {errors[`menu-price-${index}`]}
                              </p>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor={`menu-availability-${index}`}>
                              Availability
                            </Label>
                            <select
                              id={`menu-availability-${index}`}
                              value={item.availability}
                              onChange={(event) =>
                                handleMenuChange(
                                  index,
                                  'availability',
                                  event.target.value,
                                )
                              }
                              className="h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm"
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="UNAVAILABLE">Unavailable</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-3">
                        <label
                          htmlFor={`menu-picture-${index}`}
                          className="flex h-32 w-full cursor-pointer items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-xs font-medium text-neutral-500 hover:border-neutral-400"
                        >
                          {item.picture ? (
                            <FilePreview
                              file={item.picture}
                              alt={item.name || 'Menu item'}
                            />
                          ) : (
                            <MenuPlaceholder />
                          )}
                        </label>
                        <input
                          id={`menu-picture-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(event) =>
                            handleMenuChange(
                              index,
                              'picture',
                              event.target.files?.[0] ?? null,
                            )
                          }
                          className="sr-only"
                        />
                        {form.menu.length > 1 ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-neutral-500 hover:text-red-600"
                            onClick={() => removeMenuItem(index)}
                          >
                            Remove item
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                  {errors.menu && <p className="text-xs text-red-600">{errors.menu}</p>}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
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

                <div className="space-y-4">
                  <div className="grid gap-4 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                    <div className="space-y-1 text-sm">
                      <p className="font-semibold text-neutral-900">
                        {form.name || 'Restaurant name'}
                      </p>
                      <p className="text-neutral-600">
                        {form.buildingNumber} {form.streetName}, {form.city},{' '}
                        {form.state} {form.zipCode}
                      </p>
                    </div>
                    <div className="text-sm text-neutral-600">
                      <p className="font-semibold text-neutral-900">Primary contact</p>
                      <p>{form.contactPerson}</p>
                      <p>{form.email}</p>
                      <p>{form.phone}</p>
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
                  <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5">
                    <p className="text-sm font-semibold text-neutral-900">Menu preview</p>
                    <ul className="mt-3 space-y-2 text-xs text-neutral-600">
                      {form.menu.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-neutral-900">
                              {item.name || 'Unnamed item'}
                            </p>
                            {item.description ? <p>{item.description}</p> : null}
                          </div>
                          <div className="text-right text-neutral-500">
                            <p>
                              {item.availability === 'AVAILABLE'
                                ? 'Available'
                                : 'Unavailable'}
                            </p>
                            <p>{item.price ? `$${item.price}` : '$0.00'}</p>
                          </div>
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
