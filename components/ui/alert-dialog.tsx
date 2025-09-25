'use client'

/**
 * AlertDialog (shadcn-style wrapper around Radix UI):
 * - Accessible confirmation dialog with keyboard support.
 * - Exports the standard shadcn API:
 *   AlertDialog, AlertDialogTrigger, AlertDialogContent,
 *   AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
 *   AlertDialogCancel, AlertDialogAction
 *
 * Install dependency if needed:
 *   npm i @radix-ui/react-alert-dialog
 */

import * as React from 'react'
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog'

export const AlertDialog = AlertDialogPrimitive.Root
export const AlertDialogTrigger = AlertDialogPrimitive.Trigger
export const AlertDialogPortal = AlertDialogPrimitive.Portal

// Overlay backdrop
export const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(function AlertDialogOverlay({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Overlay
      ref={ref}
      className={[
        'fixed inset-0 z-50 bg-black/80',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
})

// Content card
export const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(function AlertDialogContent({ className, children, ...props }, ref) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        ref={ref}
        className={[
          'fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4',
          'rounded-lg border bg-background p-6 shadow-lg',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]',
          'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
          className ?? '',
        ].join(' ')}
        {...props}
      >
        {children}
      </AlertDialogPrimitive.Content>
    </AlertDialogPortal>
  )
})

// Header and footer wrappers
export function AlertDialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={['flex flex-col space-y-2 text-center sm:text-left', className ?? ''].join(' ')}
      {...props}
    />
  )
}

export function AlertDialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        // Mobile: stack with reverse so primary action appears last visually
        'flex flex-col-reverse gap-2',
        // Desktop: row, aligned to end, allow wrapping to prevent overflow
        'sm:flex-row sm:justify-end sm:gap-2 sm:flex-wrap',
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
}

export const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(function AlertDialogTitle({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Title
      ref={ref}
      className={['text-lg font-semibold', className ?? ''].join(' ')}
      {...props}
    />
  )
})

export const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(function AlertDialogDescription({ className, ...props }, ref) {
  return (
    <AlertDialogPrimitive.Description
      ref={ref}
      className={['text-sm text-muted-foreground', className ?? ''].join(' ')}
      {...props}
    />
  )
})

// Action/Cancel support `asChild` so you can wrap your own Button
export const AlertDialogAction = AlertDialogPrimitive.Action
export const AlertDialogCancel = AlertDialogPrimitive.Cancel