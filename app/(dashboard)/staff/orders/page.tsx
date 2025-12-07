'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useAdminStore, StaffAssignedOrder, Driver } from '@/app/(dashboard)/admin/_state/admin-store'
import { IconDownload, IconTruckDelivery, IconCheck, IconSearch } from '@tabler/icons-react'

// Stable minute-only formatter (UTC) and hydration-safe time
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

function Card({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
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

export default function StaffOrdersPage() {
  const { state, actions } = useAdminStore()
  const queue = state.orders
  const assigned: StaffAssignedOrder[] = state.assignedOrders
  const active = assigned.filter((a) => a.status !== 'DELIVERED')
  const delivered = assigned.filter((a) => a.status === 'DELIVERED')
  const drivers: Driver[] = state.drivers

  // Retrieve first
  function retrieveFirst() {
    const res = actions.staffRetrieveFirstOrder?.()
    if (!res) return toast.warning('No orders in queue.')
    toast.success(`Retrieved order ${res.id}`)
  }

  // Retrieve specific (select any order from queue)
  const [selectedOrderId, setSelectedOrderId] = React.useState('')
  function retrieveSelected() {
    const id = selectedOrderId.trim()
    if (!id) return toast.error('Select an order from the queue.')
    const res = actions.staffRetrieveOrderById?.(id)
    if (!res) return toast.error('Order not found in queue (maybe already taken).')
    toast.success(`Retrieved order ${id}`)
    setSelectedOrderId('')
  }

  // Assign driver
  const [assigning, setAssigning] = React.useState<Record<string, string>>({})
  function assignDriver(orderId: string) {
    const driverId = assigning[orderId]
    if (!driverId) return toast.error('Select a driver first.')
    actions.staffAssignDriver?.(orderId, driverId)
    toast.success('Driver assigned.')
    setAssigning((m) => ({ ...m, [orderId]: '' }))
  }

  // Delivered time
  const [deliveredHHMM, setDeliveredHHMM] = React.useState<Record<string, string>>({})
  function parseHHMM(hhmm: string): string | null {
    const m = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(hhmm)
    if (!m) return null
    const d = new Date()
    d.setHours(parseInt(m[1], 10), parseInt(m[2], 10), 0, 0) // seconds=0
    return d.toISOString()
  }
  function markDelivered(orderId: string, driverId?: string) {
    if (!driverId) return toast.error('Assign a driver before confirming delivery.')
    const hhmm = deliveredHHMM[orderId]
    if (!hhmm) return toast.error('Enter delivered time as HH:MM (24h).')
    const iso = parseHHMM(hhmm)
    if (!iso) return toast.error('Time must be HH:MM (24h).')
    actions.staffMarkDelivered?.(orderId, iso)
    toast.success('Delivery recorded.')
    setDeliveredHHMM((m) => ({ ...m, [orderId]: '' }))
  }

  // Find assigned order by ID (for orders with an assigned driver already)
  const [findId, setFindId] = React.useState('')
  const foundAssigned = active.find((o) => o.id.toLowerCase() === findId.trim().toLowerCase()) ||
                        delivered.find((o) => o.id.toLowerCase() === findId.trim().toLowerCase())

  // Details modal
  const [detail, setDetail] = React.useState<StaffAssignedOrder | null>(null)

  return (
    <div className="space-y-6">
      {/* Retrieve */}
      <Card
        title="Retrieve Orders"
        right={
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <Button size="sm" onClick={retrieveFirst}>
              <IconDownload className="mr-1 h-4 w-4" /> Retrieve First
            </Button>
            <div className="flex items-center gap-2">
              <select
                className="h-8 rounded-md border px-2 text-sm"
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
              >
                <option value="">Select order from queue</option>
                {queue.filter((o) => o.status === 'QUEUED').map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.id} — {o.restaurantName}
                  </option>
                ))}
              </select>
              <Button size="sm" variant="outline" onClick={retrieveSelected}>Retrieve Selected</Button>
            </div>
          </div>
        }
      >
        <div className="text-sm text-muted-foreground">
          - Retrieve First: takes the first QUEUED order and saves it before removal from the queue.
          <br />
          - Retrieve Selected: choose any order from the queue to take next.
        </div>
      </Card>

      {/* Find assigned order by ID */}
      <Card
        title="Find Assigned/Out-for-Delivery Order"
        right={
          <div className="flex items-center gap-2">
            <input
              className="h-8 w-[220px] rounded-md border px-2 text-sm"
              placeholder="Enter Order ID (e.g., ORD-30241)"
              value={findId}
              onChange={(e) => setFindId(e.target.value)}
            />
            <IconSearch className="h-4 w-4 text-muted-foreground" />
          </div>
        }
      >
        <div className="text-sm">
          {findId.trim() ? (
            foundAssigned ? (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">{foundAssigned.id} — {foundAssigned.restaurantName}</div>
                <div className="grid gap-2 text-sm">
                  <div className="text-muted-foreground">Estimated: <Time iso={foundAssigned.estimatedDeliveryAt} /></div>
                  <div className="flex items-center gap-2">
                    {foundAssigned.driverId ? (
                      <span>
                        {drivers.find((d) => d.id === foundAssigned.driverId)?.name ?? '—'} <span className="text-muted-foreground">(On trip)</span>
                      </span>
                    ) : (
                      <>
                        <select
                          className="h-8 rounded-md border px-2 text-sm"
                          value={assigning[foundAssigned.id] ?? ''}
                          onChange={(e) => setAssigning((m) => ({ ...m, [foundAssigned.id]: e.target.value }))}
                        >
                          <option value="">Select driver</option>
                          {drivers.map((d) => (
                            <option key={d.id} value={d.id} disabled={d.status === 'ON_TRIP'}>
                              {d.name} {d.status === 'ON_TRIP' ? '(On trip)' : ''}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" onClick={() => assignDriver(foundAssigned.id)}>
                          <IconTruckDelivery className="mr-1 h-4 w-4" /> Assign
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      className="h-8 w-[110px] rounded-md border px-2 text-sm"
                      placeholder="HH:MM"
                      value={deliveredHHMM[foundAssigned.id] ?? ''}
                      onChange={(e) => setDeliveredHHMM((m) => ({ ...m, [foundAssigned.id]: e.target.value }))}
                      disabled={!foundAssigned.driverId}
                    />
                    <Button size="sm" onClick={() => markDelivered(foundAssigned.id, foundAssigned.driverId)}>
                      <IconCheck className="mr-1 h-4 w-4" /> Confirm delivery
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-muted-foreground">No assigned/out-for-delivery/delivered order found with that ID.</div>
            )
          ) : (
            <div className="text-muted-foreground">Enter an Order ID to manage an order that already has an assigned driver.</div>
          )}
        </div>
      </Card>

      {/* Queue */}
      <Card title="Order Queue">
        <ul className="text-sm">
          {queue.map((o) => (
            <li key={o.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <span>{o.id} — {o.restaurantName}</span>
              <span className="text-muted-foreground">ETA: {o.etaMinutes ?? '—'} min</span>
            </li>
          ))}
          {queue.length === 0 && <li className="py-4 text-center text-muted-foreground">Queue is empty.</li>}
        </ul>
      </Card>

      {/* My Active */}
      <Card title="My Active Orders">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Order</th>
                <th className="py-2 px-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">Estimated</th>
                <th className="py-2 px-2 text-left font-medium">Driver</th>
                <th className="py-2 pl-2 text-left font-medium">Delivered (HH:MM)</th>
              </tr>
            </thead>
            <tbody>
              {active.map((a) => {
                const driverObj = a.driverId ? drivers.find((d) => d.id === a.driverId) : undefined
                const driverVal = a.driverId ? a.driverId : (assigning[a.id] ?? '')
                return (
                  <tr key={a.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{a.id}</td>
                    <td className="py-2 px-2">{a.restaurantName}</td>
                    <td className="py-2 px-2"><Time iso={a.estimatedDeliveryAt} /></td>
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
                          >
                            <option value="">Select driver</option>
                            {drivers.map((d) => (
                              <option key={d.id} value={d.id} disabled={d.status === 'ON_TRIP'}>
                                {d.name} {d.status === 'ON_TRIP' ? '(On trip)' : ''}
                              </option>
                            ))}
                          </select>
                          <Button size="sm" variant="outline" disabled={!driverVal} onClick={() => assignDriver(a.id)}>
                            <IconTruckDelivery className="mr-1 h-4 w-4" /> Assign
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
                          disabled={!a.driverId}
                        />
                        <Button size="sm" onClick={() => markDelivered(a.id, a.driverId)}>
                          <IconCheck className="mr-1 h-4 w-4" /> Confirm delivery
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {active.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">No active orders.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delivered: hide inline times; use a View details button */}
      <Card title="Delivered Orders">
        <ul className="text-sm">
          {delivered.map((a) => (
            <li key={a.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <span>{a.id} — {a.restaurantName}</span>
              <div>
                <Button size="sm" variant="ghost" onClick={() => setDetail(a)}>
                  View details
                </Button>
              </div>
            </li>
          ))}
          {delivered.length === 0 && <li className="py-4 text-center text-muted-foreground">No delivered orders yet.</li>}
        </ul>
      </Card>

      {/* Details modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h2 className="text-sm font-medium">Order Details</h2>
              <button className="rounded p-1 hover:bg-muted" onClick={() => setDetail(null)} aria-label="Close">✕</button>
            </div>
            <div className="p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Order</span>
                <span className="font-medium">{detail.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Restaurant</span>
                <span className="font-medium">{detail.restaurantName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Estimated</span>
                <span className="font-medium"><Time iso={detail.estimatedDeliveryAt} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-medium"><Time iso={detail.deliveredAt} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Driver</span>
                <span className="font-medium">
                  {(state.drivers.find((d) => d.id === detail.driverId)?.name) ?? '—'}
                </span>
              </div>
              <div className="pt-2">
                <Button size="sm" className="w-full" onClick={() => setDetail(null)}>Close</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}