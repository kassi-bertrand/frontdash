'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FormattedTime } from '@/components/ui/formatted-time'
import { Modal } from '@/components/ui/modal'
import { SectionCard } from '@/components/ui/section-card'
import { useAuth, isStaffUser } from '@/hooks/use-auth'
import { useStaffOrderActions } from '@/hooks/use-staff-order-actions'
import { timeAgo } from '@/lib/utils'
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

export default function StaffDashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  // Use shared hook for order actions
  const {
    state,
    drivers,
    orders,
    assignedOrders,
    mustChangePwd,
    assigning,
    setAssigning,
    deliveredHHMM,
    setDeliveredHHMM,
    retrieveFirst,
    assignDriver,
    markDelivered,
  } = useStaffOrderActions()

  // Enforce password change redirect (safety net for direct URL access)
  useEffect(() => {
    if (isLoading) return
    if (mustChangePwd) {
      router.replace('/staff/settings')
    }
  }, [mustChangePwd, isLoading, router])

  const queue = orders.filter((o) => o.status === 'QUEUED')
  const active = assignedOrders.filter((a) => a.status !== 'DELIVERED')
  const delivered = assignedOrders.filter((a) => a.status === 'DELIVERED')
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
        <SectionCard
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
        </SectionCard>
      </div>

      <SectionCard
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
      </SectionCard>

      <SectionCard title="My Active Orders">
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
                      <FormattedTime iso={a.estimatedDeliveryAt} />
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
      </SectionCard>

      <SectionCard
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
                    <FormattedTime iso={a.deliveredAt} />
                  </td>
                  <td className="py-2 px-2">
                    <FormattedTime iso={a.estimatedDeliveryAt} />
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
      </SectionCard>

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
                <FormattedTime iso={orderDetail.placedAt} />
              </span>
            </div>
            {orderDetail.estimatedDeliveryAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated Delivery</span>
                <span className="font-medium">
                  <FormattedTime iso={orderDetail.estimatedDeliveryAt} />
                </span>
              </div>
            )}
            {orderDetail.deliveredAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered At</span>
                <span className="font-medium">
                  <FormattedTime iso={orderDetail.deliveredAt} />
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