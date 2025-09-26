'use client'

/**
 * Admin • Restaurants — exclusivity enforced
 * - Pending Registrations:
 *   • Search, select all, bulk Approve/Reject
 *   • Pagination (5/page)
 *   • View modal: if details missing, assign placeholder details (persisted)
 *   • Excludes names already in Active Restaurants
 * - Pending Withdrawals:
 *   • View modal shows reason, Approve/Disapprove
 *   • Pagination (5/page)
 *   • Excludes names already in Active Restaurants
 * - Active Restaurants:
 *   • Click any to open an info modal (known details or placeholders)
 */

import * as React from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { IconBuildingStore, IconCheck, IconX, IconEye } from '@tabler/icons-react'
import { useAdminStore, RegistrationRequest, WithdrawalRequest, RegistrationDetails } from '../_state/admin-store'

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  const rem = mins % 60
  return rem ? `${hrs}h ${rem}m ago` : `${hrs}h ago`
}

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

function Confirm({
  trigger, title, description, confirmLabel, cancelLabel = 'Cancel', onConfirm, confirmVariant = 'default',
}: {
  trigger: React.ReactNode
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  confirmVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
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
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button size="sm" variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function Modal({ open, onClose, title, children, maxWidth = 'max-w-md' }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; maxWidth?: string }) {
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

export default function AdminRestaurantsPage() {
  const { state, actions } = useAdminStore()

  // Registrations state
  const [query, setQuery] = React.useState('')
  const [selected, setSelected] = React.useState<Record<string, boolean>>({})
  const [viewReg, setViewReg] = React.useState<RegistrationRequest | null>(null)

  // Withdrawals state
  const [viewWd, setViewWd] = React.useState<WithdrawalRequest | null>(null)

  // Active restaurant info
  const [activeInfo, setActiveInfo] = React.useState<{ name: string; details: RegistrationDetails } | null>(null)

  // Pagination
  const REG_PAGE_SIZE = 5
  const WD_PAGE_SIZE = 5
  const [regPage, setRegPage] = React.useState(1)
  const [wdPage, setWdPage] = React.useState(1)

  const registrationsFiltered = React.useMemo(
    () => state.registrations
      .filter(
        (r) =>
          r.status === 'PENDING' &&
          !state.activeRestaurants.includes(r.restaurantName) &&
          r.restaurantName.toLowerCase().includes(query.trim().toLowerCase())
      )
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [state.registrations, state.activeRestaurants, query]
  )
  const regTotalPages = Math.max(1, Math.ceil(registrationsFiltered.length / REG_PAGE_SIZE))
  const regPageItems = registrationsFiltered.slice((regPage - 1) * REG_PAGE_SIZE, regPage * REG_PAGE_SIZE)

  const withdrawalsSorted = React.useMemo(
    () =>
      state.withdrawals
        .filter((w) => w.status === 'PENDING' && !state.activeRestaurants.includes(w.restaurantName))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
    [state.withdrawals, state.activeRestaurants]
  )
  const wdTotalPages = Math.max(1, Math.ceil(withdrawalsSorted.length / WD_PAGE_SIZE))
  const wdPageItems = withdrawalsSorted.slice((wdPage - 1) * WD_PAGE_SIZE, wdPage * WD_PAGE_SIZE)

  const allSelected = regPageItems.length > 0 && regPageItems.every((r) => selected[r.id])
  const anySelected = regPageItems.some((r) => selected[r.id])

  function toggleAll(checked: boolean) {
    const next = { ...selected }
    regPageItems.forEach((r) => (next[r.id] = checked))
    setSelected(next)
  }
  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => ({ ...prev, [id]: checked }))
  }

  function approveReg(id: string) {
    const row = state.registrations.find((r) => r.id === id)
    actions.approveRegistration(id)
    toast.success(`Approved ${row?.restaurantName ?? 'registration'}`)
  }
  function rejectReg(id: string) {
    const row = state.registrations.find((r) => r.id === id)
    actions.rejectRegistration(id)
    toast.warning(`Rejected ${row?.restaurantName ?? 'registration'}`)
  }

  function approveSelected() {
    regPageItems.forEach((r) => {
      if (selected[r.id]) actions.approveRegistration(r.id)
    })
    setSelected({})
  }
  function rejectSelected() {
    regPageItems.forEach((r) => {
      if (selected[r.id]) actions.rejectRegistration(r.id)
    })
    setSelected({})
  }

  function approveWithdrawal(id: string) {
    const req = state.withdrawals.find((w) => w.id === id)
    actions.approveWithdrawal(id)
    toast.success(`Approved withdrawal: ${req?.restaurantName}`)
  }
  function disapproveWithdrawal(id: string) {
    const req = state.withdrawals.find((w) => w.id === id)
    actions.disapproveWithdrawal(id)
    toast.warning(`Disapproved withdrawal: ${req?.restaurantName}`)
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

  function openActiveInfo(name: string) {
    const known = state.registrations.find((r) => r.restaurantName === name && r.details)?.details
    const details = known ?? buildPlaceholderDetails()
    setActiveInfo({ name, details })
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
              onConfirm={approveSelected}
            />
            <Confirm
              trigger={<Button size="sm" variant="destructive" disabled={!anySelected}>Reject selected</Button>}
              title="Reject selected requests?"
              confirmLabel="Reject"
              confirmVariant="destructive"
              onConfirm={rejectSelected}
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
                <tr key={r.id} className="border-b last:border-0">
                  <td className="py-2 pl-2">
                    <input
                      type="checkbox"
                      aria-label={`Select ${r.restaurantName}`}
                      checked={!!selected[r.id]}
                      onChange={(e) => toggleOne(r.id, e.target.checked)}
                    />
                  </td>
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
                        onConfirm={() => approveReg(r.id)}
                      />
                      <Confirm
                        trigger={<Button size="sm" variant="destructive"><IconX className="mr-1 h-4 w-4" />Reject</Button>}
                        title={`Reject ${r.restaurantName}?`}
                        confirmLabel="Reject"
                        confirmVariant="destructive"
                        onConfirm={() => rejectReg(r.id)}
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
        {/* Pagination (5 per page) */}
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
                <tr key={w.id} className="border-b last:border-0">
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
                        onConfirm={() => approveWithdrawal(w.id)}
                      />
                      <Confirm
                        trigger={<Button size="sm" variant="destructive">Disapprove</Button>}
                        title={`Disapprove withdrawal for ${w.restaurantName}?`}
                        confirmLabel="Disapprove"
                        confirmVariant="destructive"
                        onConfirm={() => disapproveWithdrawal(w.id)}
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
        {/* Pagination (5 per page) */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {wdPage} of {wdTotalPages}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={wdPage <= 1} onClick={() => setWdPage((p) => Math.max(1, p - 1))}>Prev</Button>
            <Button size="sm" variant="outline" disabled={wdPage >= wdTotalPages} onClick={() => setWdPage((p) => Math.min(wdTotalPages, p + 1))}>Next</Button>
          </div>
        </div>
      </Section>

      {/* Active Restaurants */}
      <Section title={`Active Restaurants (${state.activeRestaurants.length})`}>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {state.activeRestaurants.map((name) => (
            <li
              key={name}
              className="cursor-pointer rounded-md border p-3 hover:bg-muted/50"
              onClick={() => openActiveInfo(name)}
              title="View info"
            >
              {name}
            </li>
          ))}
          {state.activeRestaurants.length === 0 && (
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
              <Button size="sm" onClick={() => { approveReg(viewReg.id); setViewReg(null) }}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => { rejectReg(viewReg.id); setViewReg(null) }}>Reject</Button>
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
              <Button size="sm" onClick={() => { approveWithdrawal(viewWd.id); setViewWd(null) }}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => { disapproveWithdrawal(viewWd.id); setViewWd(null) }}>Disapprove</Button>
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
              <div className="font-medium">{activeInfo.name}</div>
            </div>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="font-medium">Details</div>
              <div className="grid gap-1">
                <div className="text-muted-foreground">Address</div>
                <div>
                  {activeInfo.details.address?.street ?? '—'}{activeInfo.details.address?.street ? ',' : ''}{' '}
                  {activeInfo.details.address?.city ?? ''}{activeInfo.details.address?.city ? ',' : ''}{' '}
                  {activeInfo.details.address?.state ?? ''} {activeInfo.details.address?.zip ?? ''}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Phone</div>
                <div>{activeInfo.details.phone ?? '—'}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Hours</div>
                <div>{activeInfo.details.hours ?? '—'}</div>
              </div>
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