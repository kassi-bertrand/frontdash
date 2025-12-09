'use client'

/**
 * Admin • Restaurants
 * - Pending Registrations: Search, select all, bulk Approve/Reject, pagination
 * - Pending Withdrawals: View, Approve/Disapprove, pagination
 * - Active Restaurants: List of approved restaurants
 */

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Confirm } from '@/components/ui/confirm'
import { Modal } from '@/components/ui/modal'
import { IconBuildingStore, IconCheck, IconX, IconEye } from '@tabler/icons-react'
import {
  useRestaurantStore,
  type RegistrationRequest,
  type WithdrawalRequest,
  type RestaurantAddress,
  type RestaurantId,
} from '@/lib/stores'
import { timeAgo } from '@/lib/utils'

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-background p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <IconBuildingStore className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-medium">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function formatAddress(address?: RestaurantAddress): string {
  if (!address) return '—'
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zip
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : '—'
}

export default function AdminRestaurantsPage() {
  // Zustand store
  const {
    registrations,
    withdrawals,
    activeRestaurants,
    fetchRestaurants,
    approveRegistration,
    rejectRegistration,
    approveWithdrawal,
    rejectWithdrawal,
  } = useRestaurantStore()

  // Fetch data on mount
  React.useEffect(() => {
    fetchRestaurants()
  }, [fetchRestaurants])

  // Registrations state
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [viewReg, setViewReg] = React.useState<RegistrationRequest | null>(null)

  // Withdrawals state
  const [viewWd, setViewWd] = React.useState<WithdrawalRequest | null>(null)

  // Active restaurant info
  const [activeInfo, setActiveInfo] = React.useState<string | null>(null)

  // Pagination
  const REG_PAGE_SIZE = 5
  const WD_PAGE_SIZE = 5
  const [regPage, setRegPage] = React.useState(1)
  const [wdPage, setWdPage] = React.useState(1)

  const registrationsFiltered = React.useMemo(
    () => registrations
      .filter(
        (r) =>
          r.status === 'PENDING' &&
          !activeRestaurants.includes(r.restaurantName) &&
          r.restaurantName.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [registrations, activeRestaurants, query]
  )
  const regTotalPages = Math.max(1, Math.ceil(registrationsFiltered.length / REG_PAGE_SIZE))
  const regPageItems = registrationsFiltered.slice((regPage - 1) * REG_PAGE_SIZE, regPage * REG_PAGE_SIZE)

  const withdrawalsSorted = React.useMemo(
    () =>
      withdrawals
        .filter((w) => w.status === 'PENDING' && !activeRestaurants.includes(w.restaurantName))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [withdrawals, activeRestaurants]
  )
  const wdTotalPages = Math.max(1, Math.ceil(withdrawalsSorted.length / WD_PAGE_SIZE))
  const wdPageItems = withdrawalsSorted.slice((wdPage - 1) * WD_PAGE_SIZE, wdPage * WD_PAGE_SIZE)

  const allSelected = regPageItems.length > 0 && regPageItems.every((r) => selected[String(r.id)])
  const anySelected = regPageItems.some((r) => selected[String(r.id)])

  function toggleAll(checked: boolean) {
    const next = { ...selected }
    regPageItems.forEach((r) => (next[String(r.id)] = checked))
    setSelected(next)
  }
  function toggleOne(id: RestaurantId, checked: boolean) {
    setSelected((prev) => ({ ...prev, [String(id)]: checked }))
  }

  async function handleApproveReg(id: RestaurantId, name: string) {
    try {
      await approveRegistration(id)
      toast.success(`Approved ${name}`)
    } catch {
      toast.error(`Failed to approve ${name}`)
    }
  }

  async function handleRejectReg(id: RestaurantId, name: string) {
    try {
      await rejectRegistration(id)
      toast.warning(`Rejected ${name}`)
    } catch {
      toast.error(`Failed to reject ${name}`)
    }
  }

  async function handleApproveSelected() {
    let succeeded = 0
    let failed = 0
    for (const r of regPageItems) {
      if (selected[String(r.id)]) {
        try {
          await approveRegistration(r.id)
          succeeded++
        } catch {
          failed++
        }
      }
    }
    setSelected({})
    if (failed === 0) {
      toast.success(`Approved ${succeeded} registration${succeeded !== 1 ? 's' : ''}`)
    } else if (succeeded === 0) {
      toast.error(`Failed to approve ${failed} registration${failed !== 1 ? 's' : ''}`)
    } else {
      toast.warning(`Approved ${succeeded}, failed ${failed}`)
    }
  }

  async function handleRejectSelected() {
    let succeeded = 0
    let failed = 0
    for (const r of regPageItems) {
      if (selected[String(r.id)]) {
        try {
          await rejectRegistration(r.id)
          succeeded++
        } catch {
          failed++
        }
      }
    }
    setSelected({})
    if (failed === 0) {
      toast.warning(`Rejected ${succeeded} registration${succeeded !== 1 ? 's' : ''}`)
    } else if (succeeded === 0) {
      toast.error(`Failed to reject ${failed} registration${failed !== 1 ? 's' : ''}`)
    } else {
      toast.warning(`Rejected ${succeeded}, failed ${failed}`)
    }
  }

  async function handleApproveWithdrawal(id: RestaurantId, name: string) {
    try {
      await approveWithdrawal(id)
      toast.success(`Approved withdrawal: ${name}`)
    } catch {
      toast.error(`Failed to approve withdrawal for ${name}`)
    }
  }

  async function handleRejectWithdrawal(id: RestaurantId, name: string) {
    try {
      await rejectWithdrawal(id)
      toast.warning(`Disapproved withdrawal: ${name}`)
    } catch {
      toast.error(`Failed to disapprove withdrawal for ${name}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pending Registrations */}
      <Section
        title="Pending Registration Requests"
        action={
          <div className="flex items-center gap-2">
            <input
              className="h-9 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              placeholder="Search..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setRegPage(1) }}
            />
            <Confirm
              trigger={<Button size="sm" variant="outline" disabled={!anySelected}>Approve selected</Button>}
              title="Approve selected requests?"
              confirmLabel="Approve"
              onConfirm={handleApproveSelected}
            />
            <Confirm
              trigger={<Button size="sm" variant="destructive" disabled={!anySelected}>Reject selected</Button>}
              title="Reject selected requests?"
              confirmLabel="Reject"
              confirmVariant="destructive"
              onConfirm={handleRejectSelected}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pl-2 text-left">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={allSelected}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th className="py-2 pr-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">Submitted</th>
                <th className="py-2 pl-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {regPageItems.map((r) => (
                <tr key={String(r.id)} className="border-b last:border-0">
                  <td className="py-2 pl-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.restaurantName}`}
                      checked={!!selected[String(r.id)]}
                      onChange={(e) => toggleOne(r.id, e.target.checked)}
                    />
                  </td>
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
                        onConfirm={() => handleApproveReg(r.id, r.restaurantName)}
                      />
                      <Confirm
                        trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>}
                        title={`Reject ${r.restaurantName}?`}
                        confirmLabel="Reject"
                        confirmVariant="destructive"
                        onConfirm={() => handleRejectReg(r.id, r.restaurantName)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {regPageItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-muted-foreground">No pending registrations.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {regPage} of {regTotalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={regPage <= 1} onClick={() => setRegPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={regPage >= regTotalPages} onClick={() => setRegPage((p) => Math.min(regTotalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Section>

      {/* Pending Withdrawals */}
      <Section title="Pending Withdrawal Requests">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-2 text-left font-medium">Restaurant</th>
                <th className="py-2 px-2 text-left font-medium">Requested</th>
                <th className="py-2 pl-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {wdPageItems.map((w) => (
                <tr key={String(w.id)} className="border-b last:border-0">
                  <td className="py-2 pr-2">{w.restaurantName}</td>
                  <td className="py-2 px-2">{timeAgo(w.requestedAt)}</td>
                  <td className="py-2 pl-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewWd(w)}>
                        <IconEye className="mr-1 h-4 w-4" />
                        View
                      </Button>
                      <Confirm
                        trigger={<Button size="sm">Approve</Button>}
                        title={`Approve withdrawal for ${w.restaurantName}?`}
                        confirmLabel="Approve"
                        onConfirm={() => handleApproveWithdrawal(w.id, w.restaurantName)}
                      />
                      <Confirm
                        trigger={<Button size="sm" variant="destructive">Disapprove</Button>}
                        title={`Disapprove withdrawal for ${w.restaurantName}?`}
                        confirmLabel="Disapprove"
                        confirmVariant="destructive"
                        onConfirm={() => handleRejectWithdrawal(w.id, w.restaurantName)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
              {wdPageItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">No pending withdrawals.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {wdPage} of {wdTotalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={wdPage <= 1} onClick={() => setWdPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={wdPage >= wdTotalPages} onClick={() => setWdPage((p) => Math.min(wdTotalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Section>

      {/* Active Restaurants */}
      <Section title={`Active Restaurants (${activeRestaurants.length})`}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {activeRestaurants.map((name) => (
            <li
              key={name}
              className="cursor-pointer rounded-md border p-3 hover:bg-muted/50"
              onClick={() => setActiveInfo(name)}
              title="View info"
            >
              {name}
            </li>
          ))}
          {activeRestaurants.length === 0 && (
            <li className="text-muted-foreground">No active restaurants.</li>
          )}
        </ul>
      </Section>

      {/* Registration Details Modal */}
      <Modal open={!!viewReg} onClose={() => setViewReg(null)} title="Registration Details">
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
              <Button size="sm" onClick={() => { handleApproveReg(viewReg.id, viewReg.restaurantName); setViewReg(null) }}>Approve</Button>
              <Confirm
                trigger={<Button size="sm" variant="destructive">Reject</Button>}
                title={`Reject ${viewReg.restaurantName}?`}
                description="This will permanently delete the registration request."
                confirmLabel="Reject"
                confirmVariant="destructive"
                onConfirm={() => { handleRejectReg(viewReg.id, viewReg.restaurantName); setViewReg(null) }}
              />
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewReg(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Withdrawal Details Modal */}
      <Modal open={!!viewWd} onClose={() => setViewWd(null)} title="Withdrawal Request">
        {viewWd && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Restaurant</div>
              <div className="font-medium">{viewWd.restaurantName}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Requested</div>
              <div>{timeAgo(viewWd.requestedAt)}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Reason</div>
              <div>{viewWd.reason ?? '—'}</div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={() => { handleApproveWithdrawal(viewWd.id, viewWd.restaurantName); setViewWd(null) }}>Approve</Button>
              <Confirm
                trigger={<Button size="sm" variant="destructive">Disapprove</Button>}
                title={`Disapprove withdrawal for ${viewWd.restaurantName}?`}
                description="The restaurant will remain active on FrontDash."
                confirmLabel="Disapprove"
                confirmVariant="destructive"
                onConfirm={() => { handleRejectWithdrawal(viewWd.id, viewWd.restaurantName); setViewWd(null) }}
              />
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setViewWd(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Active Restaurant Info Modal */}
      <Modal open={!!activeInfo} onClose={() => setActiveInfo(null)} title="Restaurant Info">
        {activeInfo && (
          <div className="space-y-4 text-sm">
            <div>
              <div className="text-muted-foreground">Restaurant</div>
              <div className="font-medium">{activeInfo}</div>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground">
                This restaurant is currently active and accepting orders.
              </p>
            </div>
            <div className="pt-2">
              <Button size="sm" variant="outline" className="ml-auto" onClick={() => setActiveInfo(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
