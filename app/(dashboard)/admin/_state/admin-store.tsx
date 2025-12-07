'use client'

import * as React from 'react'

// Types
export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type RegistrationDetails = {
  address?: { street?: string; city?: string; state?: string; zip?: string }
  phone?: string
  hours?: string
}
export type RegistrationRequest = {
  id: string
  restaurantName: string
  submittedAt: string // ISO
  status: RegistrationStatus
  details?: RegistrationDetails
}
export type WithdrawalRequest = {
  id: string
  restaurantName: string
  requestedAt: string // ISO
  status: 'PENDING' | 'APPROVED' | 'DISAPPROVED'
  reason?: string
}

export type OrderStatus = 'QUEUED' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'
export type QueuedOrder = {
  id: string
  restaurantName: string
  placedAt: string // ISO
  etaMinutes?: number
  status: OrderStatus
}

export type StaffAssignedOrder = {
  id: string
  restaurantName: string
  placedAt: string // ISO
  etaMinutes?: number
  estimatedDeliveryAt?: string // ISO
  assignedAt: string // ISO
  driverId?: string
  deliveredAt?: string // ISO
  status: OrderStatus // ASSIGNED | OUT_FOR_DELIVERY | DELIVERED
}

export type Staff = {
  id: string
  firstName: string
  lastName: string
  username: string
  email?: string
  lastPasswordChangedAt?: string
}

export type Driver = {
  id: string
  name: string
  email?: string
  phone?: string
  vehicle?: { make?: string; model?: string; plate?: string; color?: string }
  lastAssignmentAt?: string
  status?: 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'
}

export type AdminState = {
  registrations: RegistrationRequest[]
  withdrawals: WithdrawalRequest[]
  activeRestaurants: string[]
  staff: Staff[]
  drivers: Driver[]
  orders: QueuedOrder[]            // Queue
  assignedOrders: StaffAssignedOrder[] // Staff working set (saved before removal)
  ordersToday: number
}

export type AdminActions = {
  // Admin
  approveRegistration: (id: string) => void
  rejectRegistration: (id: string) => void
  approveWithdrawal: (id: string) => void
  disapproveWithdrawal: (id: string) => void
  addRegistrationRequest: (restaurantName: string, details?: RegistrationDetails) => void
  addWithdrawalRequest: (restaurantName: string, reason?: string) => void
  setRegistrationDetails: (id: string, details: RegistrationDetails) => void
  addStaff: (first: string, last: string) => { first: string; last: string; username: string; password: string }
  removeStaff: (id: string) => void
  hireDriver: (name: string) => { name: string }
  fireDriver: (id: string) => void

  // Staff workflow
  staffRetrieveFirstOrder: () => (StaffAssignedOrder & { status: OrderStatus }) | null
  staffRetrieveOrderById: (orderId: string) => (StaffAssignedOrder & { status: OrderStatus }) | null
  staffAssignDriver: (orderId: string, driverId: string) => void
  staffMarkDelivered: (orderId: string, deliveredAtISO?: string) => void
}

export type AdminMetrics = {
  activeRestaurants: number
  pendingRegistrations: number
  pendingWithdrawals: number
  ordersToday: number
  driversAvailable: number
  staffCount: number
}

// Helpers to avoid SSR/client drift: generate ISO with seconds=0
function isoMinutesAgo(mins: number) {
  const d = new Date()
  d.setMinutes(d.getMinutes() - mins, 0, 0) // seconds=0
  return d.toISOString()
}
function addMinutes(iso?: string, mins?: number) {
  if (!iso || !mins || mins <= 0) return undefined
  const d = new Date(iso)
  d.setMinutes(d.getMinutes() + mins, 0, 0) // seconds=0
  return d.toISOString()
}

// Demo data
const initialRegistrations: RegistrationRequest[] = [
  { id: 'rq-1009', restaurantName: 'Spice Villa', submittedAt: isoMinutesAgo(60), status: 'PENDING' },
  { id: 'rq-1010', restaurantName: 'Green Bowl', submittedAt: isoMinutesAgo(120), status: 'PENDING' },
  { id: 'rq-0999', restaurantName: 'Golden Wok', submittedAt: isoMinutesAgo(24 * 60), status: 'APPROVED' },
]

const initialWithdrawals: WithdrawalRequest[] = [
  { id: 'wd-2001', restaurantName: 'Old Town Bakery', requestedAt: isoMinutesAgo(5 * 60), status: 'PENDING', reason: 'Renovations' },
]

const initialActiveRestaurants = ['Spice Villa', 'Green Bowl', 'Bella Pasta', 'Ocean Catch', 'Golden Wok']

const initialStaff: Staff[] = [
  { id: 's-1', firstName: 'Nora', lastName: 'James', username: 'james42', email: 'james42@frontdash.app', lastPasswordChangedAt: isoMinutesAgo(0) },
  { id: 's-2', firstName: 'Liam', lastName: 'Chen', username: 'chen67', email: 'chen67@frontdash.app', lastPasswordChangedAt: isoMinutesAgo(0) },
]

// Drivers: d-1 currently ON_TRIP (has an active order), others AVAILABLE
const initialDrivers: Driver[] = [
  { id: 'd-1', name: 'Alex Morgan', status: 'ON_TRIP',  lastAssignmentAt: isoMinutesAgo(40) },
  { id: 'd-2', name: 'Priya Shah',  status: 'AVAILABLE' },
  { id: 'd-3', name: 'Diego Ramos', status: 'AVAILABLE' },
]

// Queue: a few orders waiting (seconds=0 to avoid hydration drift)
const initialOrders: QueuedOrder[] = [
  { id: 'ORD-30241', restaurantName: 'Bella Pasta',  placedAt: isoMinutesAgo(9),  etaMinutes: 38, status: 'QUEUED' },
  { id: 'ORD-30242', restaurantName: 'Spice Villa',  placedAt: isoMinutesAgo(15), etaMinutes: 42, status: 'QUEUED' },
  { id: 'ORD-30243', restaurantName: 'Green Bowl',   placedAt: isoMinutesAgo(27), etaMinutes: 31, status: 'QUEUED' },
  { id: 'ORD-30244', restaurantName: 'Ocean Catch',  placedAt: isoMinutesAgo(33), etaMinutes: 44, status: 'QUEUED' },
  { id: 'ORD-30245', restaurantName: 'Golden Wok',   placedAt: isoMinutesAgo(48), etaMinutes: 36, status: 'QUEUED' },
]

// Context
const AdminStoreContext = React.createContext<{ state: AdminState; actions: AdminActions } | null>(null)

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AdminState>({
    registrations: initialRegistrations,
    withdrawals: initialWithdrawals,
    activeRestaurants: initialActiveRestaurants,
    staff: initialStaff,
    drivers: initialDrivers,
    orders: initialOrders,
    // Seed some active and delivered orders so dashboards aren't empty
    assignedOrders: [
      // Active (OUT_FOR_DELIVERY) — driver d-1 currently on trip
      {
        id: 'ORD-30235',
        restaurantName: 'Golden Wok',
        placedAt: isoMinutesAgo(50),
        etaMinutes: 35,
        estimatedDeliveryAt: addMinutes(isoMinutesAgo(50), 35),
        assignedAt: isoMinutesAgo(40),
        driverId: 'd-1',
        status: 'OUT_FOR_DELIVERY',
      },
      // Delivered — driver became available
      {
        id: 'ORD-30231',
        restaurantName: 'Bella Pasta',
        placedAt: isoMinutesAgo(90),
        etaMinutes: 40,
        estimatedDeliveryAt: addMinutes(isoMinutesAgo(90), 40),
        assignedAt: isoMinutesAgo(80),
        driverId: 'd-3',
        deliveredAt: isoMinutesAgo(30),
        status: 'DELIVERED',
      },
      {
        id: 'ORD-30230',
        restaurantName: 'Ocean Catch',
        placedAt: isoMinutesAgo(120),
        etaMinutes: 45,
        estimatedDeliveryAt: addMinutes(isoMinutesAgo(120), 45),
        assignedAt: isoMinutesAgo(110),
        driverId: 'd-2',
        deliveredAt: isoMinutesAgo(70),
        status: 'DELIVERED',
      },
    ],
    ordersToday: 1847,
  })

  // Admin actions (unchanged omitted for brevity) ...

  const approveRegistration: AdminActions['approveRegistration'] = (id) => {
    setState((prev) => {
      const target = prev.registrations.find((r) => r.id === id)
      if (!target) return prev
      const name = target.restaurantName
      const registrations = prev.registrations.map((r): RegistrationRequest =>
        r.id === id ? { ...r, status: 'APPROVED' as const } :
        (r.restaurantName === name && r.status === 'PENDING') ? { ...r, status: 'REJECTED' as const } : r
      )
      const withdrawals = prev.withdrawals.filter((w) => !(w.restaurantName === name && w.status === 'PENDING'))
      const activeRestaurants = prev.activeRestaurants.includes(name) ? prev.activeRestaurants : [name, ...prev.activeRestaurants]
      return { ...prev, registrations, withdrawals, activeRestaurants }
    })
  }
  const rejectRegistration: AdminActions['rejectRegistration'] = (id) => {
    setState((prev) => ({ ...prev, registrations: prev.registrations.map((r): RegistrationRequest => r.id === id ? { ...r, status: 'REJECTED' as const } : r) }))
  }
  const approveWithdrawal: AdminActions['approveWithdrawal'] = (id) => {
    setState((prev) => ({ ...prev, withdrawals: prev.withdrawals.filter((w) => w.id !== id) }))
  }
  const disapproveWithdrawal: AdminActions['disapproveWithdrawal'] = (id) => {
    setState((prev) => {
      const req = prev.withdrawals.find((w) => w.id === id)
      const activeRestaurants = req && !prev.activeRestaurants.includes(req.restaurantName)
        ? [req.restaurantName, ...prev.activeRestaurants] : prev.activeRestaurants
      return { ...prev, withdrawals: prev.withdrawals.filter((w) => w.id !== id), activeRestaurants }
    })
  }
  const addRegistrationRequest: AdminActions['addRegistrationRequest'] = (restaurantName, details) => {
    const name = restaurantName.trim(); if (!name) return
    setState((prev) => {
      if (prev.activeRestaurants.includes(name)) return prev
      if (prev.registrations.some((r) => r.restaurantName.toLowerCase() === name.toLowerCase() && r.status === 'PENDING')) return prev
      const reg: RegistrationRequest = { id: `rq-${Date.now()}`, restaurantName: name, submittedAt: isoMinutesAgo(0), status: 'PENDING', details }
      return { ...prev, registrations: [reg, ...prev.registrations] }
    })
  }
  const addWithdrawalRequest: AdminActions['addWithdrawalRequest'] = (restaurantName, reason) => {
    const name = restaurantName.trim(); if (!name) return
    setState((prev) => {
      if (!prev.activeRestaurants.includes(name)) return prev
      if (prev.withdrawals.some((w) => w.restaurantName === name && w.status === 'PENDING')) return prev
      const wd: WithdrawalRequest = { id: `wd-${Date.now()}`, restaurantName: name, requestedAt: isoMinutesAgo(0), status: 'PENDING', reason: reason?.trim() || 'No reason' }
      return { ...prev, withdrawals: [wd, ...prev.withdrawals], activeRestaurants: prev.activeRestaurants.filter((n) => n !== name) }
    })
  }
  const setRegistrationDetails: AdminActions['setRegistrationDetails'] = (id, details) => {
    setState((prev) => ({ ...prev, registrations: prev.registrations.map((r) => r.id === id ? { ...r, details: { ...r.details, ...details } } : r) }))
  }

  // Staff & drivers (unchanged from your latest) ...
  const addStaff: AdminActions['addStaff'] = (first, last) => {
    const f = first.trim(), l = last.trim(); if (!f || !l) return { first: f, last: l, username: '', password: '' }
    let username = ''; let tries = 0
    do { username = `${l.toLowerCase()}${String(Math.floor(Math.random() * 90) + 10)}`; tries++ } while (tries < 10 && state.staff.some((s) => s.username === username))
    const password = (() => {
      const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ', lower = 'abcdefghijkmnopqrstuvwxyz', digits = '23456789'
      const pool = upper + lower + digits, pick = (s: string) => s[Math.floor(Math.random() * s.length)]
      const base = [pick(upper), pick(lower), pick(digits), ...Array.from({ length: 5 }, () => pick(pool))]
      for (let i = base.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [base[i], base[j]] = [base[j], base[i]] }
      return base.join('')
    })()
    const email = `${username}@frontdash.app`
    const lastPasswordChangedAt = isoMinutesAgo(0)
    setState((prev) => ({ ...prev, staff: [{ id: `s-${Date.now()}`, firstName: f, lastName: l, username, email, lastPasswordChangedAt }, ...prev.staff] }))
    return { first: f, last: l, username, password }
  }
  const removeStaff: AdminActions['removeStaff'] = (id) => {
    setState((prev) => ({ ...prev, staff: prev.staff.filter((s) => s.id !== id) }))
  }
  const hireDriver: AdminActions['hireDriver'] = (name) => {
    const n = name.trim(); if (!n) return { name: n }
    setState((prev) => ({ ...prev, drivers: [{ id: `d-${Date.now()}`, name: n, status: 'AVAILABLE' }, ...prev.drivers] }))
    return { name: n }
  }
  const fireDriver: AdminActions['fireDriver'] = (id) => {
    setState((prev) => ({ ...prev, drivers: prev.drivers.filter((d) => d.id !== id) }))
  }

  // Staff order workflow
  const staffRetrieveFirstOrder: AdminActions['staffRetrieveFirstOrder'] = () => {
    let picked: QueuedOrder | undefined
    let assignedCopy: StaffAssignedOrder | null = null
    setState((prev) => {
      const idx = prev.orders.findIndex((o) => o.status === 'QUEUED')
      if (idx === -1) return prev
      const nextOrders = prev.orders.slice()
      picked = nextOrders[idx]
      nextOrders.splice(idx, 1)
      assignedCopy = {
        id: picked.id,
        restaurantName: picked.restaurantName,
        placedAt: picked.placedAt,
        etaMinutes: picked.etaMinutes,
        estimatedDeliveryAt: addMinutes(picked.placedAt, picked.etaMinutes),
        assignedAt: isoMinutesAgo(0),
        status: 'ASSIGNED',
      }
      return { ...prev, orders: nextOrders, assignedOrders: [assignedCopy, ...prev.assignedOrders] }
    })
    return assignedCopy
  }

  const staffRetrieveOrderById: AdminActions['staffRetrieveOrderById'] = (orderId) => {
    let picked: QueuedOrder | undefined
    let assignedCopy: StaffAssignedOrder | null = null
    setState((prev) => {
      const idx = prev.orders.findIndex((o) => o.status === 'QUEUED' && o.id === orderId)
      if (idx === -1) return prev
      const nextOrders = prev.orders.slice()
      picked = nextOrders[idx]
      nextOrders.splice(idx, 1)
      assignedCopy = {
        id: picked.id,
        restaurantName: picked.restaurantName,
        placedAt: picked.placedAt,
        etaMinutes: picked.etaMinutes,
        estimatedDeliveryAt: addMinutes(picked.placedAt, picked.etaMinutes),
        assignedAt: isoMinutesAgo(0),
        status: 'ASSIGNED',
      }
      return { ...prev, orders: nextOrders, assignedOrders: [assignedCopy, ...prev.assignedOrders] }
    })
    return assignedCopy
  }

  const staffAssignDriver: AdminActions['staffAssignDriver'] = (orderId, driverId) => {
    setState((prev) => ({
      ...prev,
      assignedOrders: prev.assignedOrders.map((a) =>
        a.id === orderId ? { ...a, driverId, status: 'OUT_FOR_DELIVERY' } : a
      ),
      drivers: prev.drivers.map((d) =>
        d.id === driverId ? { ...d, status: 'ON_TRIP', lastAssignmentAt: isoMinutesAgo(0) } : d
      ),
    }))
  }

  const staffMarkDelivered: AdminActions['staffMarkDelivered'] = (orderId, deliveredAtISO) => {
    const deliveredAt = deliveredAtISO || isoMinutesAgo(0)
    setState((prev) => {
      const order = prev.assignedOrders.find((a) => a.id === orderId)
      const driverId = order?.driverId
      return {
        ...prev,
        assignedOrders: prev.assignedOrders.map((a) =>
          a.id === orderId ? { ...a, deliveredAt, status: 'DELIVERED' } : a
        ),
        drivers: driverId
          ? prev.drivers.map((d) => (d.id === driverId ? { ...d, status: 'AVAILABLE' } : d))
          : prev.drivers,
      }
    })
  }

  const actions: AdminActions = {
    approveRegistration,
    rejectRegistration,
    approveWithdrawal,
    disapproveWithdrawal,
    addRegistrationRequest,
    addWithdrawalRequest,
    setRegistrationDetails,
    addStaff,
    removeStaff,
    hireDriver,
    fireDriver,
    staffRetrieveFirstOrder,
    staffRetrieveOrderById,
    staffAssignDriver,
    staffMarkDelivered,
  }

  return <AdminStoreContext.Provider value={{ state, actions }}>{children}</AdminStoreContext.Provider>
}

// Hook export
export function useAdminStore() {
  const ctx = React.useContext(AdminStoreContext)
  if (!ctx) throw new Error('useAdminStore must be used within AdminStoreProvider')
  return ctx
}

// Metrics for Admin Dashboard
export function selectMetrics(state: AdminState) {
  return {
    activeRestaurants: state.activeRestaurants.length,
    pendingRegistrations: state.registrations.filter((r) => r.status === 'PENDING').length,
    pendingWithdrawals: state.withdrawals.filter((w) => w.status === 'PENDING').length,
    ordersToday: state.ordersToday,
    driversAvailable: state.drivers.filter((d) => d.status !== 'ON_TRIP').length,
    staffCount: state.staff.length,
  }
}