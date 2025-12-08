'use client'

/**
 * Withdraw Request Card
 * =====================
 * Allows restaurant owners to request withdrawal from the FrontDash platform.
 *
 * DATA FLOW:
 * 1. On mount: Fetches restaurant to check if withdrawal is already pending
 * 2. If account_status === 'WITHDRAWAL_PENDING': Shows "request submitted" UI
 * 3. On submit: Calls restaurantApi.requestWithdrawal() to change status
 *
 * IMPORTANT - FORM DATA NOT STORED:
 * The form collects effectiveDate, reason, and details for UX purposes, but
 * the current backend API only changes account_status to 'WITHDRAWAL_PENDING'.
 * The form details are displayed locally after submission but are NOT persisted
 * to the database. Future enhancement: store these in a withdrawal_requests table.
 *
 * UI STATES:
 * - Loading: Spinner while fetching restaurant status
 * - Pending: Shows confirmation if withdrawal already requested
 * - Form: Shows withdrawal request form if status is not WITHDRAWAL_PENDING
 */

import { useMemo, useState, useEffect, useCallback } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { IconAlertTriangle, IconLoader2, IconCheck } from '@tabler/icons-react'
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
import { useAuth, isRestaurantUser } from '@/hooks/use-auth'
import { restaurantApi, type Restaurant } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

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

/**
 * Local-only request data for display after submission.
 * This data is NOT stored in the backend - only shown in the UI for the current session.
 */
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
  const { user } = useAuth()
  const form = useForm<WithdrawFormValues>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      effectiveDate: '',
      reason: undefined,
      details: '',
      acknowledgement: false,
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [queuedRequest, setQueuedRequest] = useState<QueuedRequest | null>(null)
  const [accountStatus, setAccountStatus] = useState<Restaurant['account_status'] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reasonOptions = useMemo(
    () =>
      withdrawalReasonValues.map((value) => ({
        value,
        label: withdrawalReasonLabels[value],
      })),
    [],
  )

  // Fetch restaurant to check if withdrawal is already pending
  const fetchRestaurant = useCallback(async () => {
    if (!user || !isRestaurantUser(user)) return

    setIsLoading(true)
    try {
      const restaurant = await restaurantApi.getById(user.restaurantId)
      setAccountStatus(restaurant.account_status)
    } catch (err) {
      console.error('Failed to fetch restaurant status:', err)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  async function onSubmit(values: WithdrawFormValues) {
    if (!user || !isRestaurantUser(user)) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Call real API to request withdrawal
      await restaurantApi.requestWithdrawal(user.restaurantId)

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
      setAccountStatus('WITHDRAWAL_PENDING')
      form.reset({
        effectiveDate: '',
        reason: undefined,
        details: '',
        acknowledgement: false,
      })
    } catch (err) {
      console.error('Failed to submit withdrawal request:', err)
      setError(getErrorMessage(err, 'Failed to submit withdrawal request'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state
  if (isLoading) {
    return (
      <section id="withdrawal" className="scroll-mt-28">
        <Card className="border-emerald-100 bg-white/90 shadow-lg shadow-emerald-100/40">
          <CardContent className="flex items-center justify-center py-12">
            <IconLoader2 className="size-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-sm text-neutral-600">Loading...</span>
          </CardContent>
        </Card>
      </section>
    )
  }

  // Show pending state if withdrawal already requested
  if (accountStatus === 'WITHDRAWAL_PENDING') {
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
                Withdrawal pending
              </span>
            </Badge>
            <CardTitle className="text-2xl font-semibold text-neutral-900">
              Withdrawal Request Submitted
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <IconCheck className="mt-0.5 size-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Your withdrawal request is being reviewed</p>
                  <p className="mt-1 text-sm text-amber-700">
                    The FrontDash admin team will review your request and verify all payouts
                    are reconciled. You&apos;ll receive an email once a decision is made.
                  </p>
                </div>
              </div>
            </div>
            {queuedRequest && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Request details
                </p>
                <dl className="mt-2 space-y-1 text-xs text-neutral-600">
                  <div className="flex justify-between">
                    <dt>Reference:</dt>
                    <dd className="font-mono">{queuedRequest.reference}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Submitted:</dt>
                    <dd>{queuedRequest.submittedAt}</dd>
                  </div>
                </dl>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    )
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
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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
