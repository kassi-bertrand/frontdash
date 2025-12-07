'use client'

/**
 * Admin Dashboard — using shared AdminStore
 * - Shortcuts appear above Quick Actions
 * - Quick Actions:
 *   • Staff: "Hire" + confirmation modal
 *   • Drivers: "Hire" + confirmation modal
 * - Newest Registration Requests:
 *   • Added "View" (eye) button with details modal (placeholder details if missing)
 */

import * as React from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  IconBuildingStore,
  IconTruckDelivery,
  IconUsersGroup,
  IconPlaylistAdd,
  IconArrowUpRight,
  IconArrowDownRight,
  IconAlertTriangle,
  IconShoppingCart,
  IconUserPlus,
  IconCheck,
  IconX,
  IconX as IconClose,
  IconSettings,
  IconEye,
} from '@tabler/icons-react'
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
import { useAdminStore, selectMetrics, QueuedOrder, RegistrationRequest, RegistrationDetails } from '@/app/(dashboard)/admin/_state/admin-store'

// Helpers
function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem ? `${hrs}h ${rem}m ago` : `${hrs}h ago`
}
function StatusDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
}

// Local placeholder builder for registration details (mirrors Restaurants page)
function buildPlaceholderDetails(): RegistrationDetails {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]
  const streets = ['100 Sample Rd', '42 Garden Ave', '725 Pine St', '15 River Way', '908 Canyon Dr']
  const cities = ['Austin', 'Dallas', 'Seattle', 'Atlanta', 'Denver']
  const states = ['TX', 'WA', 'GA', 'CO', 'CA']
  const hours = ['Mon–Fri 9:00–21:00; Sat–Sun 10:00–22:00', 'Daily 11:00–23:00', 'Mon–Sat 10:00–20:00; Sun 12:00–18:00']
  const phones = ['512-555-0100', '206-555-0101', '404-555-0102', '303-555-0103', '415-555-0104']
  return {
    address: {
      street: pick(streets),
      city: pick(cities),
      state: pick(states),
      zip: String(10000 + Math.floor(Math.random() * 89999)),
    },
    phone: pick(phones),
    hours: pick(hours),
  }
}

// UI bits
function KpiCard({ title, value, icon, accent = 'bg-primary/10 text-primary', delta, deltaPositive }: { title: string; value: string | number; icon: React.ReactNode; accent?: string; delta?: string; deltaPositive?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent}`}>{icon}</div>
        {delta ? (
          <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${deltaPositive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'}`}>
            {deltaPositive ? <IconArrowUpRight size={16} /> : <IconArrowDownRight size={16} />}
            {delta}
          </div>
        ) : null}
      </div>
      <div className="mt-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </div>
    </div>
  )
}
function SectionCard({ title, children, actionButton }: { title: string; children: React.ReactNode; actionButton?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {actionButton}
      </div>
      {children}
    </div>
  )
}
function Confirm({ trigger, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, confirmVariant = 'default' }: { trigger: React.ReactNode; title: string; description?: string; confirmLabel?: string; cancelLabel?: string; onConfirm: () => void; confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
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
function Modal({ open, onClose, title, children, maxWidth = 'max-w-2xl', scroll = false }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string; scroll?: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`relative w-full ${maxWidth} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded p-1 hover:bg-muted">
            <IconClose className="h-4 w-4" />
          </button>
        </div>
        <div className={`p-4 ${scroll ? 'max-h-[60vh] overflow-y-auto' : ''}`}>{children}</div>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { state, actions } = useAdminStore()
  const metrics = selectMetrics(state)

  const registrationsPending = state.registrations.filter((r) => r.status === 'PENDING').slice(0, 5)
  const ordersShort = state.orders.slice(0, 5)

  const [showRegistrationsModal, setShowRegistrationsModal] = React.useState(false)
  const [showOrdersModal, setShowOrdersModal] = React.useState(false)

  // Hire Staff confirmation modal
  const [staffModal, setStaffModal] = React.useState<{ open: boolean; first: string; last: string; username: string; password: string }>({ open: false, first: '', last: '', username: '', password: '' })

  // Hire Driver confirmation modal
  const [driverModal, setDriverModal] = React.useState<{ open: boolean; name: string; email?: string; phone?: string; vehicle?: { make?: string; model?: string; plate?: string; color?: string } }>({
    open: false, name: '', email: '', phone: '', vehicle: undefined,
  })

  // Registration Details modal (for "Newest Registration Requests")
  const [viewReg, setViewReg] = React.useState<RegistrationRequest | null>(null)

  // Quick Actions form state
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [driverName, setDriverName] = React.useState('')

  // Staff: Hire handler
  function hireStaff() {
    const f = firstName.trim()
    const l = lastName.trim()
    if (f.length < 2 || l.length < 2) {
      toast.error('Names must be at least 2 letters.')
      return
    }
    const res = actions.addStaff(f, l)
    setStaffModal({ open: true, ...res })
    setFirstName('')
    setLastName('')
  }

  // Drivers: Hire handler
  function hireDriverQuick() {
    const name = driverName.trim()
    if (name.length < 2) {
      toast.error('Driver name must be at least 2 characters.')
      return
    }
    if (state.drivers.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Driver name must be unique.')
      return
    }
  const res = actions.hireDriver(name)
  // hireDriver currently returns only { name }; optional details (email/phone/vehicle) aren't provided
  setDriverModal((m) => ({ ...m, open: true, name: res.name }))
    setDriverName('')
  }

  function openRegView(r: RegistrationRequest) {
    let reg = r
    if (!reg.details) {
      const details = buildPlaceholderDetails()
      actions.setRegistrationDetails(reg.id, details)
      reg = { ...reg, details }
    }
    setViewReg(reg)
  }

  function approveFromModal(id: string) {
    actions.approveRegistration(id)
    setViewReg(null)
  }
  function rejectFromModal(id: string) {
    actions.rejectRegistration(id)
    setViewReg(null)
  }

  function ordersInQueueCount() {
    return state.orders.filter((o) => o.status === 'QUEUED').length
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Active Restaurants" value={metrics.activeRestaurants} icon={<IconBuildingStore className="h-5 w-5" />} accent="bg-blue-500/10 text-blue-600" delta="+8 this week" deltaPositive />
        <KpiCard title="Orders Today" value={metrics.ordersToday} icon={<IconShoppingCart className="h-5 w-5" />} accent="bg-emerald-500/10 text-emerald-600" delta="+15%" deltaPositive />
        <KpiCard title="Orders in Queue" value={ordersInQueueCount()} icon={<IconPlaylistAdd className="h-5 w-5" />} accent="bg-amber-500/10 text-amber-600" />
        <KpiCard title="Pending Registrations" value={metrics.pendingRegistrations} icon={<IconAlertTriangle className="h-5 w-5" />} accent="bg-rose-500/10 text-rose-600" />
        <KpiCard title="Drivers Available" value={metrics.driversAvailable} icon={<IconTruckDelivery className="h-5 w-5" />} accent="bg-cyan-500/10 text-cyan-600" />
        <KpiCard title="Staff Members" value={metrics.staffCount} icon={<IconUsersGroup className="h-5 w-5" />} accent="bg-violet-500/10 text-violet-600" />
      </div>

      {/* Shortcuts (above Quick Actions) */}
      <SectionCard title="Shortcuts">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Button asChild variant="outline" className="h-20 justify-start gap-3">
            <Link href="/admin/staff">
              <IconUsersGroup className="h-5 w-5" />
              <span className="text-sm font-medium">Staff</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 justify-start gap-3">
            <Link href="/admin/drivers">
              <IconTruckDelivery className="h-5 w-5" />
              <span className="text-sm font-medium">Drivers</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 justify-start gap-3">
            <Link href="/admin/restaurants">
              <IconBuildingStore className="h-5 w-5" />
              <span className="text-sm font-medium">Restaurants</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-20 justify-start gap-3">
            <Link href="/admin/settings">
              <IconSettings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </Link>
          </Button>
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Hire Staff */}
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <IconUserPlus className="h-4 w-4" />
              Hire Staff
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <input className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" onClick={hireStaff}>Hire</Button>
              <Button size="sm" variant="outline" onClick={() => { setFirstName(''); setLastName('') }}>Reset</Button>
            </div>
          </div>

          {/* Hire Driver */}
          <div className="rounded-md border p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <IconTruckDelivery className="h-4 w-4" />
              Hire Driver
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2" placeholder="Driver full name" value={driverName} onChange={(e) => setDriverName(e.target.value)} />
              <div className="flex gap-2 sm:justify-end">
                <Button size="sm" onClick={hireDriverQuick}>Hire</Button>
                <Button size="sm" variant="outline" onClick={() => setDriverName('')}>Reset</Button>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Queues */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Registrations */}
        <SectionCard
          title="Newest Registration Requests"
          actionButton={<Button size="sm" variant="outline" onClick={() => setShowRegistrationsModal(true)}>View all</Button>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-2 text-left font-medium">Restaurant</th>
                  <th className="py-2 px-2 text-left font-medium">Submitted</th>
                  <th className="py-2 pl-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrationsPending.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{r.restaurantName}</td>
                    <td className="py-2 px-2">{timeAgo(r.submittedAt)}</td>
                    <td className="py-2 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => openRegView(r)}>
                          <IconEye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Confirm
                          trigger={<Button size="sm" variant="outline"><IconCheck className="mr-1 h-4 w-4" />Approve</Button>}
                          title={`Approve ${r.restaurantName}?`}
                          confirmLabel="Approve"
                          onConfirm={() => actions.approveRegistration(r.id)}
                        />
                        <Confirm
                          trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>}
                          title={`Reject ${r.restaurantName}?`}
                          confirmLabel="Reject"
                          confirmVariant="destructive"
                          onConfirm={() => actions.rejectRegistration(r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {registrationsPending.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-muted-foreground">No pending registrations.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {/* Orders (read-only) */}
        <SectionCard
          title="Orders in Queue"
          actionButton={<Button size="sm" variant="outline" onClick={() => setShowOrdersModal(true)}>View all</Button>}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2 pr-2 text-left font-medium">Order #</th>
                  <th className="py-2 px-2 text-left font-medium">Restaurant</th>
                  <th className="py-2 px-2 text-left font-medium">Placed</th>
                  <th className="py-2 px-2 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersShort.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{o.id}</td>
                    <td className="py-2 px-2">{o.restaurantName}</td>
                    <td className="py-2 px-2">{timeAgo(o.placedAt)}</td>
                    <td className="py-2 px-2">
                      <span className="inline-flex items-center gap-2">
                        {o.status === 'QUEUED' && <StatusDot color="#f59e0b" />}
                        {o.status === 'ASSIGNED' && <StatusDot color="#3b82f6" />}
                        {o.status === 'OUT_FOR_DELIVERY' && <StatusDot color="#10b981" />}
                        <span className="capitalize">{o.status.toLowerCase().replace(/_/g, ' ')}</span>
                      </span>
                    </td>
                  </tr>
                ))}
                {ordersShort.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">No orders in queue.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      {/* Staff Hire Confirmation Modal */}
      <Modal open={staffModal.open} onClose={() => setStaffModal((m) => ({ ...m, open: false }))} title="Staff Account Created" maxWidth="max-w-md">
        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">First name</span><span className="font-medium">{staffModal.first}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Last name</span><span className="font-medium">{staffModal.last}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Username</span><span className="font-mono text-sm">{staffModal.username}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Temporary Password</span><span className="font-mono text-sm select-none">•••••••• (hidden)</span></div>
          <div className="pt-1"><Button size="sm" className="w-full" onClick={() => setStaffModal((m) => ({ ...m, open: false }))}>Close</Button></div>
        </div>
      </Modal>

      {/* Driver Hire Confirmation Modal */}
      <Modal open={driverModal.open} onClose={() => setDriverModal((m) => ({ ...m, open: false }))} title="Driver Hired" maxWidth="max-w-md">
        <div className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Name</span><div className="font-medium">{driverModal.name}</div></div>
          <div><span className="text-muted-foreground">Email</span><div className="font-mono text-sm">{driverModal.email ?? '—'}</div></div>
          <div><span className="text-muted-foreground">Phone</span><div className="font-mono text-sm">{driverModal.phone ?? '—'}</div></div>
          <div>
            <span className="text-muted-foreground">Vehicle</span>
            <div>
              {driverModal.vehicle
                ? `${driverModal.vehicle.color ?? ''} ${driverModal.vehicle.make ?? ''} ${driverModal.vehicle.model ?? ''} • ${driverModal.vehicle.plate ?? ''}`.trim()
                : '—'}
            </div>
          </div>
          <div className="pt-1">
            <Button size="sm" className="w-full" onClick={() => setDriverModal((m) => ({ ...m, open: false }))}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Registration Details Modal (from Newest Registration Requests) */}
      <Modal open={!!viewReg} onClose={() => setViewReg(null)} title="Registration Details" maxWidth="max-w-md">
        {viewReg && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Restaurant</div>
              <div className="font-medium">{viewReg.restaurantName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Submitted</div>
              <div>{timeAgo(viewReg.submittedAt)}</div>
            </div>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="font-medium">Provided Details</div>
              <div className="grid gap-1">
                <div className="text-muted-foreground">Address</div>
                <div>
                  {viewReg.details?.address?.street ?? '—'}{viewReg.details?.address?.street ? ',' : ''}{' '}
                  {viewReg.details?.address?.city ?? ''}{viewReg.details?.address?.city ? ',' : ''}{' '}
                  {viewReg.details?.address?.state ?? ''} {viewReg.details?.address?.zip ?? ''}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div>{viewReg.details?.phone ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Hours</div>
                <div>{viewReg.details?.hours ?? '—'}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => approveFromModal(viewReg.id)}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => rejectFromModal(viewReg.id)}>Reject</Button>
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewReg(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* View All Registrations Modal */}
      <Modal open={showRegistrationsModal} onClose={() => setShowRegistrationsModal(false)} title="All Registration Requests" scroll>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 text-left font-medium">Restaurant</th>
              <th className="py-2 px-2 text-left font-medium">Submitted</th>
              <th className="py-2 px-2 text-left font-medium">Status</th>
              <th className="py-2 pl-2 text-left font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.registrations.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{r.restaurantName}</td>
                <td className="py-2 px-2">{timeAgo(r.submittedAt)}</td>
                <td className="py-2 px-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                    r.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600'
                    : r.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-500/10 text-rose-600'
                  }`}>{r.status}</span>
                </td>
                <td className="py-2 pl-2">
                  {r.status === 'PENDING' ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Confirm trigger={<Button size="sm" variant="outline"><IconCheck className="mr-1 h-4 w-4" />Approve</Button>} title={`Approve ${r.restaurantName}?`} confirmLabel="Approve" onConfirm={() => actions.approveRegistration(r.id)} />
                      <Confirm trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>} title={`Reject ${r.restaurantName}?`} confirmLabel="Reject" confirmVariant="destructive" onConfirm={() => actions.rejectRegistration(r.id)} />
                    </div>
                  ) : <span className="text-muted-foreground text-xs">No actions</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* View All Orders Modal */}
      <Modal open={showOrdersModal} onClose={() => setShowOrdersModal(false)} title="All Orders (Read-Only)" scroll>
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="py-2 pr-2 text-left font-medium">Order #</th>
              <th className="py-2 px-2 text-left font-medium">Restaurant</th>
              <th className="py-2 px-2 text-left font-medium">Placed</th>
              <th className="py-2 px-2 text-left font-medium">Status</th>
              <th className="py-2 pl-2 text-left font-medium">ETA</th>
            </tr>
          </thead>
          <tbody>
            {state.orders.map((o: QueuedOrder) => (
              <tr key={o.id} className="border-b last:border-0">
                <td className="py-2 pr-2">{o.id}</td>
                <td className="py-2 px-2">{o.restaurantName}</td>
                <td className="py-2 px-2">{timeAgo(o.placedAt)}</td>
                <td className="py-2 px-2">
                  <span className="inline-flex items-center gap-1 capitalize">
                    {o.status === 'QUEUED' && <StatusDot color="#f59e0b" />}
                    {o.status === 'ASSIGNED' && <StatusDot color="#3b82f6" />}
                    {o.status === 'OUT_FOR_DELIVERY' && <StatusDot color="#10b981" />}
                    {o.status.toLowerCase().replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="py-2 pl-2">{o.etaMinutes != null ? `${o.etaMinutes} min` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </div>
  )
}