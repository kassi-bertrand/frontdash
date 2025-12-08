'use client'

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FormattedTime } from '@/components/ui/formatted-time'
import { SectionCard } from '@/components/ui/section-card'
import { useStaffOrderActions } from '@/hooks/use-staff-order-actions'
import { IconDownload, IconTruckDelivery, IconCheck, IconSearch } from '@tabler/icons-react'

export default function StaffOrdersPage() {
  // Use shared hook for order actions
  const {
    state,
    drivers,
    orders: queue,
    assignedOrders,
    assigning,
    setAssigning,
    deliveredHHMM,
    setDeliveredHHMM,
    retrieveFirst,
    retrieveById,
    assignDriver,
    markDelivered,
  } = useStaffOrderActions()

  const active = assignedOrders.filter((a) => a.status !== 'DELIVERED')
  const delivered = assignedOrders.filter((a) => a.status === 'DELIVERED')

  // Retrieve specific order from dropdown
  const [selectedOrderId, setSelectedOrderId] = React.useState('')
  async function retrieveSelected() {
    const id = selectedOrderId.trim()
    if (!id) {
      toast.error('Select an order from the queue.')
      return
    }
    const result = await retrieveById(id)
    if (result) setSelectedOrderId('')
  }

  // Find assigned order by ID (search box)
  const [findId, setFindId] = React.useState('')
  const foundAssigned = active.find((o) => o.id.toLowerCase() === findId.trim().toLowerCase()) ||
                        delivered.find((o) => o.id.toLowerCase() === findId.trim().toLowerCase())

  // Details modal
  // Use a local type for compatibility with the hook's return shape
  type OrderDetail = {
    id: string
    restaurantName: string
    estimatedDeliveryAt?: string
    deliveredAt?: string
    driverId?: string
  }
  const [detail, setDetail] = React.useState<OrderDetail | null>(null)

  return (
    <div className="space-y-6">
      {/* Retrieve */}
      <SectionCard
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
      </SectionCard>

      {/* Find assigned order by ID */}
      <SectionCard
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
                  <div className="text-muted-foreground">Estimated: <FormattedTime iso={foundAssigned.estimatedDeliveryAt} /></div>
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
      </SectionCard>

      {/* Queue */}
      <SectionCard title="Order Queue">
        <ul className="text-sm">
          {queue.map((o) => (
            <li key={o.id} className="flex items-center justify-between border-b py-2 last:border-0">
              <span>{o.id} — {o.restaurantName}</span>
              <span className="text-muted-foreground">ETA: {o.etaMinutes ?? '—'} min</span>
            </li>
          ))}
          {queue.length === 0 && <li className="py-4 text-center text-muted-foreground">Queue is empty.</li>}
        </ul>
      </SectionCard>

      {/* My Active */}
      <SectionCard title="My Active Orders">
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
                    <td className="py-2 px-2"><FormattedTime iso={a.estimatedDeliveryAt} /></td>
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
      </SectionCard>

      {/* Delivered: hide inline times; use a View details button */}
      <SectionCard title="Delivered Orders">
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
      </SectionCard>

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
                <span className="font-medium"><FormattedTime iso={detail.estimatedDeliveryAt} /></span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Delivered</span>
                <span className="font-medium"><FormattedTime iso={detail.deliveredAt} /></span>
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