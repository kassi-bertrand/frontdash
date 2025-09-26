'use client'

/**
 * Admin • Staff (shared AdminStore)
 *
 * Changes:
 * - "Create" -> "Hire" and shows a hire confirmation modal (like Dashboard).
 * - "Delete" -> "Fire" with updated confirmations.
 * - View modal now includes Email and Last password change.
 * - Search + pagination unchanged.
 */

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { IconTrash, IconUserPlus, IconEye, IconSearch } from '@tabler/icons-react'
import { useAdminStore } from '../_state/admin-store'

function Confirm({
  trigger,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  confirmLabel: string
  onConfirm: () => void
}) {
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
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" variant="destructive" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-md',
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className={`w-full ${maxWidth} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button
            className="rounded p-1 hover:bg-muted"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function timeAgo(iso?: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / (60 * 60 * 1000))
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / (60 * 1000))
  return mins > 0 ? `${mins}m ago` : 'just now'
}

export default function AdminStaffPage() {
  const { state, actions } = useAdminStore()

  // Add form
  const [first, setFirst] = React.useState('')
  const [last, setLast] = React.useState('')

  // Search + pagination
  const [q, setQ] = React.useState('')
  const PAGE_SIZE = 5
  const [page, setPage] = React.useState(1)

  // View modal
  const [viewStaffId, setViewStaffId] = React.useState<string | null>(null)
  const staffToView = state.staff.find((s) => s.id === viewStaffId) || null

  // Hire confirmation modal (like Dashboard)
  const [hireModal, setHireModal] = React.useState<{ open: boolean; first: string; last: string; username: string; password: string }>({ open: false, first: '', last: '', username: '', password: '' })

  // Derived list
  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = !term
      ? state.staff
      : state.staff.filter((s) => {
          const full = `${s.firstName} ${s.lastName}`.toLowerCase()
          return full.includes(term) || s.username.toLowerCase().includes(term)
        })
    return base.slice().sort((a, b) => {
      const ln = a.lastName.localeCompare(b.lastName)
      return ln !== 0 ? ln : a.firstName.localeCompare(b.firstName)
    })
  }, [state.staff, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = React.useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  React.useEffect(() => {
    setPage(1)
  }, [q])

  function hire() {
    if (first.trim().length < 2 || last.trim().length < 2) {
      toast.error('First and last names must be at least 2 letters.')
      return
    }
    const res = actions.addStaff(first, last)
    setFirst('')
    setLast('')
    setHireModal({ open: true, ...res })
  }

  function fire(id: string) {
    const s = state.staff.find((x) => x.id === id)
    actions.removeStaff(id)
    toast.success(`Fired staff: ${s?.firstName} ${s?.lastName}`)
    const nextCount = filtered.length - 1
    const nextTotalPages = Math.max(1, Math.ceil(nextCount / PAGE_SIZE))
    if (page > nextTotalPages) setPage(nextTotalPages)
  }

  return (
    <div className="space-y-6">
      {/* Hire Staff */}
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <IconUserPlus className="h-4 w-4" />
          Hire Staff
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            placeholder="First name"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
          />
          <input
            className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            placeholder="Last name"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Button size="sm" onClick={hire}>
            Hire
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setFirst('')
              setLast('')
            }}
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Staff List */}
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium">
            Staff Members ({filtered.length})
          </h3>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="h-9 w-[240px] rounded-md border pl-8 pr-3 text-sm outline-none focus-visible:ring-2"
              placeholder="Search name or username…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search staff"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Name</th>
                <th className="py-2 px-2 text-left font-medium">Username</th>
                <th className="py-2 pl-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">
                    {s.firstName} {s.lastName}
                  </td>
                  <td className="py-2 px-2">{s.username}</td>
                  <td className="py-2 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewStaffId(s.id)}
                      >
                        <IconEye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Confirm
                        trigger={
                          <Button size="sm" variant="destructive">
                            <IconTrash className="mr-1 h-4 w-4" />
                            Fire
                          </Button>
                        }
                        title={`Fire ${s.firstName} ${s.lastName}?`}
                        description="This action cannot be undone."
                        confirmLabel="Fire"
                        onConfirm={() => fire(s.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    className="py-6 text-center text-muted-foreground"
                  >
                    No staff members.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Staff Detail Modal (View) */}
      <Modal
        open={!!staffToView}
        onClose={() => setViewStaffId(null)}
        title="Staff Member"
      >
        {staffToView && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">
                {staffToView.firstName} {staffToView.lastName}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Username</div>
              <div className="font-mono text-sm">{staffToView.username}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-mono text-sm">{staffToView.email ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Last password change</div>
              <div>{timeAgo(staffToView.lastPasswordChangedAt)}</div>
            </div>
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="ml-auto"
                onClick={() => setViewStaffId(null)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hire Confirmation Modal */}
      <Modal
        open={hireModal.open}
        onClose={() => setHireModal((m) => ({ ...m, open: false }))}
        title="Staff Account Created"
      >
        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">First name</span>
            <span className="font-medium">{hireModal.first}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Last name</span>
            <span className="font-medium">{hireModal.last}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Username</span>
            <span className="font-mono text-sm">{hireModal.username}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Temporary Password</span>
            <span className="font-mono text-sm select-none">•••••••• (hidden)</span>
          </div>
          <div className="pt-1">
            <Button
              size="sm"
              className="w-full"
              onClick={() => setHireModal((m) => ({ ...m, open: false }))}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}