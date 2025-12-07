'use client'

/**
 * Admin • Drivers — search + pagination + detail modal + hire confirmation
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
  trigger, title, description, confirmLabel, onConfirm,
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
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Modal({
  open, onClose, title, children, maxWidth = 'max-w-md',
}: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className={`w-full ${maxWidth} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button className="rounded p-1 hover:bg-muted" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function timeAgo(iso?: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(diff / 3600000)
  if (hours >= 1) return `${hours}h ago`
  const mins = Math.floor(diff / 60000)
  return mins > 0 ? `${mins}m ago` : 'just now'
}

export default function AdminDriversPage() {
  const { state, actions } = useAdminStore()
  const [name, setName] = React.useState('')
  const [viewDriverId, setViewDriverId] = React.useState<string | null>(null)
  const driverToView = state.drivers.find((d) => d.id === viewDriverId) || null

  // Hire confirmation modal
  const [hireModal, setHireModal] = React.useState<{ open: boolean; name: string; email?: string; phone?: string; vehicle?: { make?: string; model?: string; plate?: string; color?: string } }>({
    open: false, name: '', email: '', phone: '', vehicle: undefined,
  })

  // Search + pagination
  const [q, setQ] = React.useState('')
  const PAGE_SIZE = 5
  const [page, setPage] = React.useState(1)

  const filtered = React.useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = !term ? state.drivers : state.drivers.filter((d) => d.name.toLowerCase().includes(term))
    return base.slice().sort((a, b) => a.name.localeCompare(b.name))
  }, [state.drivers, q])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = React.useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  )

  React.useEffect(() => { setPage(1) }, [q])

  function hire() {
    const clean = name.trim()
    if (clean.length < 2) return toast.error('Driver name must be at least 2 characters.')
    if (state.drivers.some((d) => d.name.toLowerCase() === clean.toLowerCase())) return toast.error('Driver name must be unique.')
    const res = actions.hireDriver(clean) // returns details for confirmation modal
    setName('')
    setHireModal({ open: true, name: res.name })
  }

  function fire(id: string) {
    const d = state.drivers.find((x) => x.id === id)
    actions.fireDriver(id)
    toast.success(`Fired driver: ${d?.name}`)
    const nextCount = filtered.length - 1
    const nextTotalPages = Math.max(1, Math.ceil(nextCount / PAGE_SIZE))
    if (page > nextTotalPages) setPage(nextTotalPages)
  }

  return (
    <div className="space-y-6">
      {/* Hire */}
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <IconUserPlus className="h-4 w-4" />
          Hire Driver
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="h-9 flex-1 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
            placeholder="Driver full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={hire}>Hire</Button>
            <Button size="sm" variant="outline" onClick={() => setName('')}>Reset</Button>
          </div>
        </div>
      </div>

      {/* Drivers List */}
      <div className="rounded-lg border bg-background p-4 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-medium">Drivers ({filtered.length})</h3>
          <div className="relative">
            <IconSearch className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              className="h-9 w-[240px] rounded-md border pl-8 pr-3 text-sm outline-none focus-visible:ring-2"
              placeholder="Search driver name…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Search drivers"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Name</th>
                <th className="py-2 pl-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{d.name}</td>
                  <td className="py-2 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewDriverId(d.id)}>
                        <IconEye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Confirm
                        trigger={<Button size="sm" variant="destructive"><IconTrash className="mr-1 h-4 w-4" />Fire</Button>}
                        title={`Fire ${d.name}?`}
                        description="This cannot be undone."
                        confirmLabel="Fire"
                        onConfirm={() => fire(d.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {pageItems.length === 0 && (
                <tr>
                  <td colSpan={2} className="py-6 text-center text-muted-foreground">No drivers.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </div>

      {/* Driver Detail Modal */}
      <Modal open={!!driverToView} onClose={() => setViewDriverId(null)} title="Driver">
        {driverToView && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{driverToView.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Email</div>
              <div className="font-mono text-sm">{driverToView.email ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Phone</div>
              <div className="font-mono text-sm">{driverToView.phone ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Vehicle</div>
              <div>
                {driverToView.vehicle
                  ? `${driverToView.vehicle.color ?? ''} ${driverToView.vehicle.make ?? ''} ${driverToView.vehicle.model ?? ''} • ${driverToView.vehicle.plate ?? ''}`.trim()
                  : '—'}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Last assignment</div>
              <div>{timeAgo(driverToView.lastAssignmentAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div>{(driverToView.status ?? 'AVAILABLE').toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase())}</div>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewDriverId(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Hire Confirmation Modal */}
      <Modal open={hireModal.open} onClose={() => setHireModal((m) => ({ ...m, open: false }))} title="Driver Hired">
        <div className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Name</span><div className="font-medium">{hireModal.name}</div></div>
          <div><span className="text-muted-foreground">Email</span><div className="font-mono text-sm">{hireModal.email ?? '—'}</div></div>
          <div><span className="text-muted-foreground">Phone</span><div className="font-mono text-sm">{hireModal.phone ?? '—'}</div></div>
          <div>
            <span className="text-muted-foreground">Vehicle</span>
            <div>{hireModal.vehicle ? `${hireModal.vehicle.color ?? ''} ${hireModal.vehicle.make ?? ''} ${hireModal.vehicle.model ?? ''} • ${hireModal.vehicle.plate ?? ''}`.trim() : '—'}</div>
          </div>
          <div className="pt-1">
            <Button size="sm" className="w-full" onClick={() => setHireModal((m) => ({ ...m, open: false }))}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}