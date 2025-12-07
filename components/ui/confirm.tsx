'use client'

import * as React from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

export interface ConfirmProps {
  /** The element that triggers the confirmation dialog */
  trigger: React.ReactNode
  /** Dialog title */
  title: string
  /** Optional description text */
  description?: string
  /** Label for the confirm button */
  confirmLabel: string
  /** Label for the cancel button (default: 'Cancel') */
  cancelLabel?: string
  /** Callback when user confirms */
  onConfirm: () => void
  /** Button variant for confirm action (default: 'default') */
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
}

/**
 * Confirmation dialog component using AlertDialog
 * Wraps a trigger element and shows a confirmation before executing an action
 *
 * @example
 * ```tsx
 * <Confirm
 *   trigger={<Button variant="destructive">Delete</Button>}
 *   title="Delete Item"
 *   description="This action cannot be undone."
 *   confirmLabel="Delete"
 *   confirmVariant="destructive"
 *   onConfirm={() => handleDelete()}
 * />
 * ```
 */
export function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  confirmVariant = 'default',
}: ConfirmProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          ) : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" variant={confirmVariant} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
