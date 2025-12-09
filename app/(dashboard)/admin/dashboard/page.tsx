'use client'

/**
 * Admin Dashboard
 * - KPIs: Active Restaurants, Orders Today, Orders in Queue, etc.
 * - Shortcuts to admin pages
 * - Quick Actions: Hire Staff, Hire Driver
 * - Newest Registration Requests + Orders in Queue
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
  IconSettings,
  IconEye,
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Confirm } from '@/components/ui/confirm'
import { Modal } from '@/components/ui/modal'
import {
  useDriverStore,
  useStaffStore,
  useRestaurantStore,
  useOrderStore,
  type RegistrationRequest,
  type RestaurantAddress,
} from '@/lib/stores'
import { timeAgo } from '@/lib/utils'

function StatusDot({ color }: { color: string }) {
  return <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
}

// UI components
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

function formatAddress(address?: RestaurantAddress): string {
  if (!address) return '—'
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export default function AdminDashboardPage() {
  // Zustand stores
  const driverStore = useDriverStore()
  const staffStore = useStaffStore()
  const restaurantStore = useRestaurantStore()
  const orderStore = useOrderStore()

  // Fetch all data on mount - use getState() to avoid stale closures
  React.useEffect(() => {
    useDriverStore.getState().fetchDrivers()
    useStaffStore.getState().fetchStaff()
    useRestaurantStore.getState().fetchRestaurants().then(() => {
      // Access fresh state after fetch completes
      const { restaurantMap } = useRestaurantStore.getState()
      useOrderStore.getState().setRestaurantMap(restaurantMap)
      useOrderStore.getState().fetchOrders()
    })
  }, [])

  // Keep restaurant map in sync
  React.useEffect(() => {
    if (Object.keys(restaurantStore.restaurantMap).length > 0) {
      useOrderStore.getState().setRestaurantMap(restaurantStore.restaurantMap)
    }
  }, [restaurantStore.restaurantMap])

  // Computed metrics
  const metrics = {
    activeRestaurants: restaurantStore.activeRestaurants.length,
    pendingRegistrations: restaurantStore.registrations.filter((r) => r.status === 'PENDING').length,
    pendingWithdrawals: restaurantStore.withdrawals.filter((w) => w.status === 'PENDING').length,
    ordersToday: orderStore.ordersDeliveredToday,
    driversAvailable: driverStore.drivers.filter((d) => d.status === 'AVAILABLE').length,
    staffCount: staffStore.staffMembers.length,
  }

  const registrationsPending = restaurantStore.registrations.filter((r) => r.status === 'PENDING').slice(0, 5)
  const ordersShort = orderStore.queuedOrders.slice(0, 5)

  const [showRegistrationsModal, setShowRegistrationsModal] = React.useState(false)
  const [showOrdersModal, setShowOrdersModal] = React.useState(false)

  // Staff hire confirmation modal
  const [staffModal, setStaffModal] = React.useState<{ open: boolean; firstName: string; lastName: string; username: string; password: string }>({
    open: false, firstName: '', lastName: '', username: '', password: ''
  })

  // Driver hire confirmation modal
  const [driverModal, setDriverModal] = React.useState<{ open: boolean; name: string }>({
    open: false, name: ''
  })

  // Registration details modal
  const [viewReg, setViewReg] = React.useState<RegistrationRequest | null>(null)

  // Quick Actions form state
  const [firstName, setFirstName] = React.useState('')
  const [lastName, setLastName] = React.useState('')
  const [driverName, setDriverName] = React.useState('')

  // Staff: Hire handler
  async function hireStaff() {
    const f = firstName.trim()
    const l = lastName.trim()
    if (f.length < 2 || l.length < 2) {
      toast.error('Names must be at least 2 letters.')
      return
    }
    try {
      const res = await staffStore.addStaffMember(f, l)
      setStaffModal({ open: true, ...res })
      setFirstName('')
      setLastName('')
    } catch {
      toast.error('Failed to add staff member.')
    }
  }

  // Driver: Hire handler
  async function hireDriverQuick() {
    const name = driverName.trim()
    if (name.length < 2) {
      toast.error('Driver name must be at least 2 characters.')
      return
    }
    if (driverStore.drivers.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Driver name must be unique.')
      return
    }
    try {
      const res = await driverStore.hireDriver(name)
      setDriverModal({ open: true, name: res.name })
      setDriverName('')
    } catch {
      toast.error('Failed to hire driver.')
    }
  }

  async function handleApproveReg(reg: RegistrationRequest) {
    try {
      await restaurantStore.approveRegistration(reg.id)
      toast.success(`Approved ${reg.restaurantName}`)
    } catch {
      toast.error('Failed to approve registration')
    }
  }

  async function handleRejectReg(reg: RegistrationRequest) {
    try {
      await restaurantStore.rejectRegistration(reg.id)
      toast.warning(`Rejected ${reg.restaurantName}`)
    } catch {
      toast.error('Failed to reject registration')
    }
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard title="Active Restaurants" value={metrics.activeRestaurants} icon={<IconBuildingStore className="h-5 w-5" />} accent="bg-blue-500/10 text-blue-600" delta="+8 this week" deltaPositive />
        <KpiCard title="Orders Today" value={metrics.ordersToday} icon={<IconShoppingCart className="h-5 w-5" />} accent="bg-emerald-500/10 text-emerald-600" delta="+15%" deltaPositive />
        <KpiCard title="Orders in Queue" value={orderStore.queuedOrders.length} icon={<IconPlaylistAdd className="h-5 w-5" />} accent="bg-amber-500/10 text-amber-600" />
        <KpiCard title="Pending Registrations" value={metrics.pendingRegistrations} icon={<IconAlertTriangle className="h-5 w-5" />} accent="bg-rose-500/10 text-rose-600" />
        <KpiCard title="Drivers Available" value={metrics.driversAvailable} icon={<IconTruckDelivery className="h-5 w-5" />} accent="bg-cyan-500/10 text-cyan-600" />
        <KpiCard title="Staff Members" value={metrics.staffCount} icon={<IconUsersGroup className="h-5 w-5" />} accent="bg-violet-500/10 text-violet-600" />
      </div>

      {/* Shortcuts */}
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
                  <tr key={String(r.id)} className="border-b last:border-0">
                    <td className="py-2 pr-2">{r.restaurantName}</td>
                    <td className="py-2 px-2">{timeAgo(r.submittedAt)}</td>
                    <td className="py-2 pl-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => setViewReg(r)}>
                          <IconEye className="mr-1 h-4 w-4" />
                          View
                        </Button>
                        <Confirm
                          trigger={<Button size="sm" variant="outline"><IconCheck className="mr-1 h-4 w-4" />Approve</Button>}
                          title={`Approve ${r.restaurantName}?`}
                          confirmLabel="Approve"
                          onConfirm={() => handleApproveReg(r)}
                        />
                        <Confirm
                          trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>}
                          title={`Reject ${r.restaurantName}?`}
                          confirmLabel="Reject"
                          confirmVariant="destructive"
                          onConfirm={() => handleRejectReg(r)}
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
                  <tr key={String(o.id)} className="border-b last:border-0">
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
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">First name</span><span className="font-medium">{staffModal.firstName}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Last name</span><span className="font-medium">{staffModal.lastName}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Username</span><span className="font-mono text-sm">{staffModal.username}</span></div>
          <div className="flex flex-col gap-1"><span className="text-muted-foreground">Temporary Password</span><span className="font-mono text-sm select-none">•••••••• (hidden)</span></div>
          <p className="text-xs text-muted-foreground">The staff member will be required to change their password on first login.</p>
          <div className="pt-1"><Button size="sm" className="w-full" onClick={() => setStaffModal((m) => ({ ...m, open: false }))}>Close</Button></div>
        </div>
      </Modal>

      {/* Driver Hire Confirmation Modal */}
      <Modal open={driverModal.open} onClose={() => setDriverModal((m) => ({ ...m, open: false }))} title="Driver Hired" maxWidth="max-w-md">
        <div className="space-y-3 text-sm">
          <div><span className="text-muted-foreground">Name</span><div className="font-medium">{driverModal.name}</div></div>
          <p className="text-muted-foreground">Driver has been added to the system and is now available for deliveries.</p>
          <div className="pt-1">
            <Button size="sm" className="w-full" onClick={() => setDriverModal((m) => ({ ...m, open: false }))}>Close</Button>
          </div>
        </div>
      </Modal>

      {/* Registration Details Modal */}
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
                <div>{formatAddress(viewReg.address)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div>{viewReg.phone ?? '—'}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => { handleApproveReg(viewReg); setViewReg(null) }}>Approve</Button>
              <Confirm
                trigger={<Button size="sm" variant="destructive">Reject</Button>}
                title={`Reject ${viewReg.restaurantName}?`}
                description="This will permanently delete the registration request."
                confirmLabel="Reject"
                confirmVariant="destructive"
                onConfirm={() => { handleRejectReg(viewReg); setViewReg(null) }}
              />
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
            {restaurantStore.registrations.map((r) => (
              <tr key={String(r.id)} className="border-b last:border-0">
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
                      <Confirm trigger={<Button size="sm" variant="outline"><IconCheck className="mr-1 h-4 w-4" />Approve</Button>} title={`Approve ${r.restaurantName}?`} confirmLabel="Approve" onConfirm={() => handleApproveReg(r)} />
                      <Confirm trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>} title={`Reject ${r.restaurantName}?`} confirmLabel="Reject" confirmVariant="destructive" onConfirm={() => handleRejectReg(r)} />
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
            {orderStore.queuedOrders.map((o) => (
              <tr key={String(o.id)} className="border-b last:border-0">
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
