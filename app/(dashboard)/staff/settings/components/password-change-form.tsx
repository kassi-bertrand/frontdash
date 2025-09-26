'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current (temporary) password'),
    newPassword: z
      .string()
      .min(8, 'Must be at least 8 characters')
      .regex(/[A-Z]/, 'Must include at least one uppercase letter')
      .regex(/[a-z]/, 'Must include at least one lowercase letter')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ['newPassword'],
    message: 'New password cannot be the same as current password',
  })

type FormValues = z.infer<typeof schema>

export default function PasswordChangeForm({
  onSuccessRedirect = '/staff',
}: {
  onSuccessRedirect?: string
}) {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: FormValues) {
    // Validate the current (temporary) password matches the one used at login
    const temp = typeof window !== 'undefined' ? sessionStorage.getItem('fd_temp_pwd') : null
    if (temp && values.currentPassword !== temp) {
      setError('currentPassword', {
        type: 'validate',
        message: 'Current password does not match your temporary password',
      })
      return
    }

    try {
      // If you add a backend later, POST to /api/staff/change-password
      await new Promise((r) => setTimeout(r, 700))

      // Success: mark as changed and clear enforcement flags
      localStorage.setItem('fd_pwd_changed', '1')
      localStorage.removeItem('fd_must_change_pwd')
      try {
        sessionStorage.removeItem('fd_temp_pwd')
      } catch {}

      toast.success('Password updated successfully')
      reset()
      router.replace(onSuccessRedirect)
    } catch (e: unknown) {
      const errorMessage =
        typeof e === 'object' &&
        e !== null &&
        'message' in e &&
        typeof (e as Record<string, unknown>).message === 'string'
          ? (e as { message: string }).message
          : 'Failed to change password'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="rounded-xl border bg-background p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Change Password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        You must set a new password before using Staff features.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-3">
        <div>
          <label htmlFor="currentPassword" className="mb-1 block text-sm text-muted-foreground">
            Current (temporary) password
          </label>
          <input
            id="currentPassword"
            type="password"
            autoComplete="current-password"
            className="h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            {...register('currentPassword')}
          />
          {errors.currentPassword && (
            <p className="mt-1 text-sm text-rose-600">{errors.currentPassword.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm text-muted-foreground">
            New password
          </label>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            {...register('newPassword')}
          />
          {errors.newPassword && (
            <p className="mt-1 text-sm text-rose-600">{errors.newPassword.message}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            Requirements: 8+ characters, at least 1 uppercase, 1 lowercase, and 1 number.
          </p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm text-muted-foreground">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-rose-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="pt-1">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Updating…' : 'Update password'}
          </Button>
        </div>
      </form>
    </div>
  )
}