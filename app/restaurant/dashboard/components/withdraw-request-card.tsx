'use client'

import { useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertTriangle } from '@tabler/icons-react'
import { useForm } from 'react-hook-form'
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'

const withdrawalReasonValues = ['seasonal', 'permanent', 'pause', 'service'] as const

type WithdrawalReason = (typeof withdrawalReasonValues)[number]

const withdrawalReasonLabels: Record<WithdrawalReason, string> = {
  seasonal: 'Seasonal or temporary closure',
  permanent: 'Permanent departure from FrontDash',
  pause: 'Short-term pause for renovations or events',
  service: 'Service or payout issue',
}

const withdrawSchema = z.object({
  effectiveDate: z.string().min(1, 'Select an effective date'),
  reason: z.enum(withdrawalReasonValues, {
    error: 'Pick the closest reason for your request',
  }),
  details: z.string().min(16, 'Share at least a short sentence so our team has context'),
  acknowledgement: z.boolean().refine((val) => val === true, {
    message: 'Please confirm there are no open orders or unpaid balances',
  }),
})

type WithdrawFormValues = z.infer<typeof withdrawSchema>

type QueuedRequest = {
  reference: string
  effectiveDate: string
  reason: WithdrawalReason
  details: string
  submittedAt: string
}

function formatDateLabel(value: string) {
  if (!value) return 'TBD'
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function generateReference() {
  return `WDR-${Math.random().toString(36).slice(-5).toUpperCase()}`
}

export function WithdrawRequestCard() {
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      effectiveDate: '',
      reason: undefined,
      details: '',
      acknowledgement: false,
    },
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queuedRequest, setQueuedRequest] = useState<QueuedRequest | null>(null)

  const reasonOptions = useMemo(
    () =>
      withdrawalReasonValues.map((value) => ({
        value,
        label: withdrawalReasonLabels[value],
      })),
    [],
  )

  async function onSubmit(values: WithdrawFormValues) {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 800))

    const reference = generateReference()
    const submittedAt = new Date().toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    setQueuedRequest({
      reference,
      ...values,
      submittedAt,
    })
    setIsSubmitting(false)
    form.reset({
      effectiveDate: '',
      reason: undefined,
      details: '',
      acknowledgement: false,
    })
  }

  return (
    <section id="withdrawal" className="scroll-mt-28">
      <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
        <CardHeader className="space-y-3">
          <Badge
            variant="outline"
            className="w-fit border-amber-200 bg-amber-100 text-amber-700"
          >
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <IconAlertTriangle className="size-4" />
              Withdrawal queue
            </span>
          </Badge>
          <CardTitle className="text-2xl font-semibold text-neutral-900">
            Withdraw from FrontDash
          </CardTitle>
          <p className="text-sm text-neutral-600">
            Let the FrontDash ops team know when you plan to step away. We&apos;ll queue
            the request for review and send a confirmation once everything is cleared.
          </p>
        </CardHeader>
        <CardContent className="pb-8">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="grid gap-6 lg:grid-cols-[2fr_1fr] lg:items-start"
              noValidate
            >
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="effectiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Desired effective date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="w-full"
                          min={new Date().toISOString().split('T')[0]}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        We recommend giving at least 48 hours for the approval queue.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>What best describes this withdrawal?</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose a reason" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reasonOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The admin dashboard groups requests by reason to speed up triage.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Share any helpful context</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={4}
                          placeholder="We're pausing for the winter farmers market season..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Include pickup schedule changes, pending payouts, or anything the
                        admin should double-check.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acknowledgement"
                  render={({ field }) => (
                    <FormItem className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                      <div className="flex items-start gap-3">
                        <FormControl>
                          <Checkbox
                            id="withdraw-acknowledge"
                            checked={field.value}
                            onCheckedChange={(checked) => field.onChange(!!checked)}
                          />
                        </FormControl>
                        <div className="space-y-1">
                          <FormLabel
                            htmlFor="withdraw-acknowledge"
                            className="font-semibold"
                          >
                            Confirm the kitchen is clear
                          </FormLabel>
                          <FormDescription>
                            Outstanding orders are fulfilled, payouts are reconciled, and
                            staff know about the request.
                          </FormDescription>
                        </div>
                      </div>
                      <FormMessage className="mt-2" />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-2 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-neutral-500 sm:text-sm">
                    Requests land in the admin withdrawal queue within a minute.
                  </span>
                  <Button type="submit" disabled={isSubmitting} className="sm:w-auto">
                    {isSubmitting ? 'Submitting…' : 'Submit withdrawal request'}
                  </Button>
                </div>
              </div>

              <aside className="space-y-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-sm text-neutral-700">
                {queuedRequest ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                        Request queued
                      </p>
                      <p className="text-xs text-neutral-500">
                        Reference {queuedRequest.reference} • Submitted{' '}
                        {queuedRequest.submittedAt}
                      </p>
                    </div>
                    <dl className="space-y-2 text-xs text-neutral-600">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-medium text-neutral-700">Effective</dt>
                        <dd>{formatDateLabel(queuedRequest.effectiveDate)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-medium text-neutral-700">Reason</dt>
                        <dd>{withdrawalReasonLabels[queuedRequest.reason]}</dd>
                      </div>
                    </dl>
                    <div>
                      <p className="text-xs font-medium text-neutral-700">
                        Notes for admins
                      </p>
                      <p className="mt-1 rounded-lg bg-white/80 p-3 text-xs text-neutral-600">
                        {queuedRequest.details}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                      What to expect
                    </p>
                    <ul className="space-y-2 text-xs text-neutral-600">
                      <li>• Admins verify payouts before approving or denying.</li>
                      <li>
                        • You&apos;ll receive an email once the decision is made (usually
                        within 48 hours).
                      </li>
                      <li>
                        • If payments are due, support will reach out with next steps.
                      </li>
                    </ul>
                  </div>
                )}
              </aside>
            </form>
          </Form>
        </CardContent>
      </Card>
    </section>
  )
}
