'use client'

import { useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconCheck, IconPlus, IconStar } from '@tabler/icons-react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'

import { restaurantContact, type RestaurantContactDetails } from '../mock-data'

const phoneNumberSchema = z.object({
  value: z.string().regex(/^\d{10}$/, 'Phone numbers must be 10 digits'),
})

const contactSchema = z.object({
  contactPerson: z.string().min(2, 'Enter the primary contact name'),
  email: z.string().email('Enter a valid email address'),
  phoneNumbers: z
    .array(phoneNumberSchema)
    .min(1, 'Provide at least one phone number'),
  street: z.string().min(5, 'Enter the pickup street address'),
  suite: z.string().trim().max(32, 'Suite exceeds 32 characters').optional(),
  city: z.string().min(2, 'Enter the city'),
  state: z.string().length(2, 'Use 2-letter state code'),
  postalCode: z.string().min(3, 'Enter the postal code'),
  notes: z.string().trim().max(180, 'Keep notes under 180 characters').optional(),
})

const defaultValues = {
  contactPerson: restaurantContact.contactPerson,
  email: restaurantContact.email,
  phoneNumbers: restaurantContact.phoneNumbers.map((value) => ({ value })),
  street: restaurantContact.street,
  suite: restaurantContact.suite ?? '',
  city: restaurantContact.city,
  state: restaurantContact.state,
  postalCode: restaurantContact.postalCode,
  notes: '',
}

type ContactFormValues = z.infer<typeof contactSchema>

export function ContactDetailsCard() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'phoneNumbers',
  })

  function onSubmit(values: ContactFormValues) {
    const payload: RestaurantContactDetails = {
      contactPerson: values.contactPerson,
      email: values.email,
      phoneNumbers: values.phoneNumbers.map((p) => p.value),
      street: values.street,
      suite: values.suite || undefined,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
    }

    console.info('Contact details queued for update:', payload)
    setLastSaved(new Date())
    form.reset({ ...values, notes: '' })
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
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-700"
            >
              <IconStar className="size-4" /> Primary: {restaurantContact.contactPerson}
            </Badge>
            {lastSaved ? (
              <span className="text-neutral-500">
                <IconCheck className="mr-1 inline size-4 text-emerald-600" /> Updated{' '}
                {lastSaved.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
              </span>
            ) : null}
          </div>
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
                <div className="space-y-3">
                  <FormLabel>Phone numbers</FormLabel>
                  <FormDescription>
                    Enter 10-digit numbers (FrontDash adds formatting).
                  </FormDescription>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <FormField
                        key={field.id}
                        control={form.control}
                        name={`phoneNumbers.${index}.value`}
                        render={({ field: phoneField }) => (
                          <FormItem>
                            <div className="flex items-center gap-3">
                              <FormControl>
                                <Input
                                  inputMode="numeric"
                                  placeholder="5125550198"
                                  {...phoneField}
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => remove(index)}
                                disabled={fields.length <= 1}
                              >
                                <span className="sr-only">Remove phone</span>×
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => append({ value: '' })}
                  >
                    <IconPlus className="size-4" /> Add phone number
                  </Button>
                </div>
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
                <FormField
                  control={form.control}
                  name="suite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Suite or unit (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Suite B" {...field} />
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
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Escalate to Morgan between 8a-11a."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-end gap-3">
                  <Button type="submit">Save contact details</Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  )
}
