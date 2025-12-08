'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export interface ModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when the modal should close */
  onClose: () => void
  /** Title displayed in the modal header */
  title: string
  /** Modal content */
  children: React.ReactNode
  /** Maximum width class (default: 'max-w-md') */
  maxWidth?: string
  /** Enable scrollable content area */
  scroll?: boolean
}

/**
 * Modal component built on shadcn Dialog
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onClose={() => setIsOpen(false)} title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <Button onClick={() => setIsOpen(false)}>Close</Button>
 * </Modal>
 * ```
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
  scroll = false,
}: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn(maxWidth, scroll && 'max-h-[85vh] overflow-hidden')}
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">{title}</DialogTitle>
        </DialogHeader>
        <div className={cn(scroll && 'max-h-[60vh] overflow-y-auto')}>
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
