'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '../admin/_state/admin-store'
import {
  IconDownload,
  IconTruckDelivery,
  IconCheck,
  IconAlertTriangle,
  IconUsers,
  IconInbox,
  IconClipboardList,
  IconChevronRight,
} from '@tabler/icons-react'

// Stable minute-only formatter (UTC) to avoid SSR/client mismatch
const dtf = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})
function Time({ iso }: { iso?: string }) {
  if (!iso) return <span>—</span>
  return <span suppressHydrationWarning>{dtf.format(new Date(iso))}</span>
}
function timeAgo(iso?: string) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d >= 1) return `${d}d ago`
  const h = Math.floor(diff / 3600000)
  if (h >= 1) return `${h}h ago`
  const m = Math.floor(diff / 60000)
  return m > 0 ? `${m}m ago` : 'just now'
}
function sameDayISOWithTime(hhmm: string): string | null {
  const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
  if (!m) return null
  const now = new Date()
  now.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0) // seconds=0
  return now.toISOString()
}

function Card({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}
function KpiCard({
  title,
  value,
  icon,
  accent = 'bg-primary/10 text-primary',
}: {
  title: string
  value: string | number
  icon: ReactNode
  accent?: string
}) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${accent}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="mt-1 text-2xl font-semibold">{value}</div>
      </div>
    </div>
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
  children: ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className={`w-full ${maxWidth} rounded-lg border bg-background shadow-lg`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          <button className="rounded p-1 hover:bg-muted" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

export default function StaffDashboardPage() {
  const router = useRouter()
  const { state, actions } = useAdminStore()

  const [mustChangePwd, setMustChangePwd] = useState(false)
  useEffect(() => {
    const role = ((typeof window !== 'undefined' ? localStorage.getItem('fd_role') : '') || '').toLowerCase()
    const changed = typeof window !== 'undefined' ? localStorage.getItem('fd_pwd_changed') === '1' : false
    const flag = typeof window !== 'undefined' ? localStorage.getItem('fd_must_change_pwd') === '1' : false
    setMustChangePwd(role === 'staff' && (!changed || flag))
  }, [])

  // Enforce redirect from the dashboard too (safety net)
  useEffect(() => {
    if (mustChangePwd) router.replace('/staff/settings')
  }, [mustChangePwd, router])

  const queue = (state?.orders ?? []).filter((o) => o.status === 'QUEUED')
  const assigned = state?.assignedOrders ?? []
  const active = assigned.filter((a) => a.status !== 'DELIVERED')
  const delivered = assigned.filter((a) => a.status === 'DELIVERED')
  const drivers = state?.drivers ?? []
  const driversAvailable = drivers.filter((d) => d.status !== 'ON_TRIP').length

  const deliveredToday = delivered.filter((a) => {
    if (!a.deliveredAt) return false
    const dt = new Date(a.deliveredAt)
    const now = new Date()
    return (
      dt.getUTCFullYear() === now.getUTCFullYear() &&
      dt.getUTCMonth() === now.getUTCMonth() &&
      dt.getUTCDate() === now.getUTCDate()
    )
  })

  function retrieveFirst() {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings before taking actions.')
      return
    }
    const res = actions.staffRetrieveFirstOrder?.()
    if (!res) return toast.warning('No orders in queue.')
    toast.success(`Retrieved order ${res.id}`)
  }

  const [assigning, setAssigning] = useState<Record<string, string>>({})
  function assignDriver(orderId: string, driverAssigned?: string) {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings before taking actions.')
      return
    }
    const driverId = assigning[orderId] || driverAssigned
    if (!driverId) return toast.error('Select a driver first.')
    actions.staffAssignDriver?.(orderId, driverId)
    toast.success('Driver assigned.')
    setAssigning((m) => ({ ...m, [orderId]: '' }))
  }

  const [deliveredHHMM, setDeliveredHHMM] = useState<Record<string, string>>({})
  function markDelivered(orderId: string, driverId?: string) {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings before taking actions.')
      return
    }
    if (!driverId) return toast.error('Assign a driver before confirming delivery.')
    const hhmm = deliveredHHMM[orderId]
    if (!hhmm) return toast.error('Enter delivered time as HH:MM (24h).')
    const iso = sameDayISOWithTime(hhmm)
    if (!iso) return toast.error('Time must be HH:MM in 24-hour format.')
    actions.staffMarkDelivered?.(orderId, iso)
    toast.success('Delivery recorded.')
    setDeliveredHHMM((m) => ({ ...m, [orderId]: '' }))
  }

  interface OrderDetail {
    id: string
    restaurantName?: string
    placedAt?: string
    estimatedDeliveryAt?: string
    deliveredAt?: string
    driverId?: string
  }
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null)
  function openOrderDetail(order: OrderDetail) {
    setOrderDetail(order)
  }
  function closeOrderDetail() {
    setOrderDetail(null)
  }

  return (
    <div className="space-y-6">
      {mustChangePwd && (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <IconAlertTriangle className="mt-0.5 h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Action required</div>
              <div className="mt-0.5">Please change your password in Settings before managing orders.</div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/staff/settings">Go to Settings</Link>
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Orders in Queue"
          value={queue.length}
          icon={<IconInbox className="h-5 w-5" />}
          accent="bg-amber-500/10 text-amber-600"
        />
        <KpiCard
          title="My Active Orders"
          value={active.length}
          icon={<IconClipboardList className="h-5 w-5" />}
          accent="bg-blue-500/10 text-blue-600"
        />
        <KpiCard title="Delivered Today" value={deliveredToday.length} icon={<IconCheck className="h-5 w-5" />} accent="bg-emerald-500/10 text-emerald-600" />
        <KpiCard title="Drivers Available" value={driversAvailable} icon={<IconUsers className="h-5 w-5" />} accent="bg-violet-500/10 text-violet-600" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card
          title="Quick Actions"
          right={
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={retrieveFirst} disabled={mustChangePwd}>
                <IconDownload className="mr-1 h-4 w-4" />
                Retrieve First
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/staff/orders">
                  View Orders <IconChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          }
        >
          <p className="text-sm text-muted-foreground">
            Take the first order from the queue and start processing. Assign a driver and confirm delivery from “My Active Orders.”
          </p>
        </Card>
      </div>

      <Card
        title="Order Queue (Preview)"
        right={
          <Button asChild size="sm" variant="outline">
            <Link href="/staff/orders">
              View All <IconChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Order</th>
                <th className="py-2 px-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">Placed</th>
                <th className="py-2 pl-2 text-left font-medium">ETA</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {queue.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{o.id}</td>
                  <td className="py-2 px-2">{o.restaurantName}</td>
                  <td className="py-2 px-2">
                    <span suppressHydrationWarning>{timeAgo(o.placedAt)}</span>
                  </td>
                  <td className="py-2 pl-2">{o.etaMinutes != null ? `${o.etaMinutes} min` : '—'}</td>
                  <td className="py-2 pl-2">
                    <Button size="sm" variant="ghost" onClick={() => openOrderDetail(o)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {queue.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Queue is empty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card title="My Active Orders">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Order</th>
                <th className="py-2 px-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">ETA</th>
                <th className="py-2 px-2 text-left font-medium">Driver</th>
                <th className="py-2 pl-2 text-left font-medium">Delivered (HH:MM)</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {active.map((a) => {
                const driverObj = a.driverId ? drivers.find((d) => d.id === a.driverId) : undefined
                const driverVal = a.driverId ? a.driverId : assigning[a.id] ?? ''
                const canDeliver = !!a.driverId && !mustChangePwd
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{a.id}</td>
                    <td className="py-2 px-2">{a.restaurantName}</td>
                    <td className="py-2 px-2">
                      <Time iso={a.estimatedDeliveryAt} />
                    </td>
                    <td className="py-2 px-2">
                      {a.driverId ? (
                        <span className="text-sm">
                          {driverObj?.name ?? '—'} <span className="text-muted-foreground">(On trip)</span>
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <select
                            className="h-8 rounded-md border px-2 text-sm"
                            value={driverVal}
                            onChange={(e) => setAssigning((m) => ({ ...m, [a.id]: e.target.value }))}
                            disabled={mustChangePwd}
                          >
                            <option value="">Select driver</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id} disabled={d.status === 'ON_TRIP'}>
                                {d.name} {d.status === 'ON_TRIP' ? '(On trip)' : ''}
                              </option>
                            ))}
                          </select>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={mustChangePwd || !driverVal}
                            onClick={() => assignDriver(a.id)}
                          >
                            <IconTruckDelivery className="mr-1 h-4 w-4" />
                            Assign
                          </Button>
                        </div>
                      )}
                    </td>
                    <td className="py-2 pl-2">
                      <div className="flex items-center gap-2">
                        <input
                          className="h-8 w-[110px] rounded-md border px-2 text-sm"
                          placeholder="HH:MM"
                          value={deliveredHHMM[a.id] ?? ''}
                          onChange={(e) => setDeliveredHHMM((m) => ({ ...m, [a.id]: e.target.value }))}
                          disabled={!canDeliver}
                        />
                        <Button size="sm" disabled={!canDeliver} onClick={() => markDelivered(a.id, a.driverId)}>
                          <IconCheck className="mr-1 h-4 w-4" />
                          Confirm delivery
                        </Button>
                      </div>
                    </td>
                    <td className="py-2 pl-2">
                      <Button size="sm" variant="ghost" onClick={() => openOrderDetail(a)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                )
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No active orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card
        title="Recent Delivered"
        right={
          <Button asChild size="sm" variant="outline">
            <Link href="/staff/orders">
              View All <IconChevronRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Order</th>
                <th className="py-2 px-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">Delivered At</th>
                <th className="py-2 px-2 text-left font-medium">Estimated</th>
                <th className="py-2 pl-2 text-left font-medium">Driver</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {delivered.slice(0, 5).map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="py-2 pr-2">{a.id}</td>
                  <td className="py-2 px-2">{a.restaurantName}</td>
                  <td className="py-2 px-2">
                    <Time iso={a.deliveredAt} />
                  </td>
                  <td className="py-2 px-2">
                    <Time iso={a.estimatedDeliveryAt} />
                  </td>
                  <td className="py-2 pl-2">{state.drivers.find((d) => d.id === a.driverId)?.name ?? '—'}</td>
                  <td className="py-2 pl-2">
                    <Button size="sm" variant="ghost" onClick={() => openOrderDetail(a)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              {delivered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted-foreground">
                    No delivered orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!orderDetail} onClose={closeOrderDetail} title="Order Details">
        {orderDetail && (
          <div className="grid gap-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Order ID</span>
              <span className="font-medium">{orderDetail.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Restaurant</span>
              <span className="font-medium">{orderDetail.restaurantName ?? '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Placed At</span>
              <span className="font-medium">
                <Time iso={orderDetail.placedAt} />
              </span>
            </div>
            {orderDetail.estimatedDeliveryAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-medium">
                  <Time iso={orderDetail.estimatedDeliveryAt} />
                </span>
              </div>
            )}
            {orderDetail.deliveredAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered At</span>
                <span className="font-medium">
                  <Time iso={orderDetail.deliveredAt} />
                </span>
              </div>
            )}
            {orderDetail.driverId && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium">
                  {state.drivers.find((d) => d.id === orderDetail.driverId)?.name ?? '—'}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}