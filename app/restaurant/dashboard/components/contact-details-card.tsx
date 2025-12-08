'use client'

/**
 * Contact Details Card
 * ====================
 * Allows restaurant owners to view and update their contact information.
 *
 * DATA FLOW:
 * 1. On mount: Fetches restaurant data via restaurantApi.getById()
 * 2. Transforms backend fields to form fields (see restaurantToFormValues)
 * 3. On save: Transforms form fields back to API format and calls restaurantApi.update()
 *
 * FIELD MAPPING (Backend → Form):
 *   owner_name      → contactPerson
 *   email_address   → email
 *   phone_number    → phoneNumbers[0] (backend only supports one phone)
 *   street_address  → street
 *   city, state, zip_code → city, state, postalCode
 *
 * NOTE: The form supports multiple phone numbers, but the backend currently
 * only stores one. We save the first phone number only.
 */

import { useState, useEffect } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconCheck, IconLoader2, IconStar } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CardLoadingState } from './card-loading-state'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAuth, isRestaurantUser } from '@/hooks/use-auth'
import { restaurantApi, type Restaurant } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

// NOTE: 10-digit phone validation assumes US/Canada format.
// Update this regex if international support is needed.
const phoneNumberSchema = z.object({
  value: z.string().regex(/^\d{10}$/, 'Enter a 10-digit US/Canada phone number (no dashes or spaces)'),
})

const contactSchema = z.object({
  contactPerson: z.string().min(2, 'Enter the primary contact name'),
  email: z.string().email('Enter a valid email address'),
  phoneNumbers: z
    .array(phoneNumberSchema)
    .min(1, 'Provide at least one phone number'),
  street: z.string().min(5, 'Enter the pickup street address'),
  city: z.string().min(2, 'Enter the city'),
  state: z.string().length(2, 'Use 2-letter state code'),
  postalCode: z.string().min(3, 'Enter the postal code'),
})

/** Convert backend Restaurant to form values (handles null/undefined fields) */
function restaurantToFormValues(restaurant: Restaurant) {
  return {
    contactPerson: restaurant.owner_name ?? '',
    email: restaurant.email_address ?? '',
    phoneNumbers: [{ value: restaurant.phone_number ?? '' }],
    street: restaurant.street_address ?? '',
    city: restaurant.city ?? '',
    state: restaurant.state ?? '',
    postalCode: restaurant.zip_code ?? '',
  }
}

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactDetailsCard() {
  const { user } = useAuth()
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactPerson: '',
      email: '',
      phoneNumbers: [{ value: '' }],
      street: '',
      city: '',
      state: '',
      postalCode: '',
    },
  })

  // Watch contact person for display in badge (single source of truth)
  const contactPerson = form.watch('contactPerson')

  // Fetch restaurant data on mount
  useEffect(() => {
    async function fetchRestaurant() {
      if (!user || !isRestaurantUser(user)) return

      setIsLoading(true)
      setError(null)

      try {
        const restaurant = await restaurantApi.getById(user.restaurantId)
        form.reset(restaurantToFormValues(restaurant))
      } catch (err) {
        console.error('Failed to fetch restaurant:', err)
        setError(getErrorMessage(err, 'Failed to load contact details'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchRestaurant()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Only refetch when user changes. form.reset is called inside but we intentionally
    // exclude it - including form would cause refetches whenever the user types.
  }, [user])

  async function onSubmit(values: ContactFormValues) {
    if (!user || !isRestaurantUser(user)) return

    setIsSaving(true)
    setError(null)

    try {
      // Map form values to backend API format
      // Note: Schema guarantees phoneNumbers has at least one entry
      const updateData = {
        owner_name: values.contactPerson,
        email_address: values.email,
        phone_number: values.phoneNumbers[0].value,
        street_address: values.street,
        city: values.city,
        state: values.state,
        zip_code: values.postalCode,
      }

      await restaurantApi.update(user.restaurantId, updateData)
      setLastSaved(new Date())
      form.reset(values)
    } catch (err) {
      console.error('Failed to save contact details:', err)
      setError(getErrorMessage(err, 'Failed to save contact details'))
    } finally {
      setIsSaving(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <section id="contact-info" className="scroll-mt-28">
        <CardLoadingState message="Loading contact details..." />
      </section>
    )
  }

  return (
    <section id="contact-info" className="scroll-mt-28">
      <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
        <CardHeader className="space-y-3">
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Contact details
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Keep dispatch lines current so the FrontDash support pod can reach the shift
            lead anytime an order question pops up.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            {contactPerson && (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-emerald-700"
              >
                <IconStar className="size-4" /> Primary: {contactPerson}
              </Badge>
            )}
            {lastSaved ? (
              <span className="text-neutral-500">
                <IconCheck className="mr-1 inline size-4 text-emerald-600" /> Updated{' '}
                {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            ) : null}
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="grid gap-6 lg:grid-cols-[1.1fr_1fr]"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary contact</FormLabel>
                      <FormControl>
                        <Input placeholder="Morgan Ellis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="ops@citrusandthyme.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumbers.0.value"
                  render={({ field: phoneField }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormDescription>
                        Enter a 10-digit number (FrontDash adds formatting).
                      </FormDescription>
                      <FormControl>
                        <Input
                          inputMode="numeric"
                          placeholder="5125550198"
                          {...phoneField}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street address</FormLabel>
                      <FormControl>
                        <Input placeholder="410 Market Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-3 gap-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="Austin" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="TX" maxLength={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal code</FormLabel>
                      <FormControl>
                        <Input placeholder="78704" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                    {isSaving ? (
                      <>
                        <IconLoader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
                        Saving...
                      </>
                    ) : (
                      'Save contact details'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  )
}
