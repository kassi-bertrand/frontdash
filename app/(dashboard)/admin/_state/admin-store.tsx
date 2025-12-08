'use client'

/**
 * Admin/Staff Store - Connected to Backend
 * =============================================================================
 * Central state management for admin and staff dashboards.
 * Fetches data from Express backend on mount and syncs after mutations.
 *
 * DATA FLOW:
 * 1. On mount: fetchData() loads orders, drivers, staff, restaurants
 * 2. On mutation: API call → refresh relevant data → update local state
 * 3. Components use useAdminStore() to read state and call actions
 *
 * ORDER STATUS MAPPING:
 *   Backend PENDING → Frontend QUEUED (in queue, not claimed)
 *   Backend CONFIRMED → Frontend ASSIGNED (staff claimed it)
 *   Backend OUT_FOR_DELIVERY → Frontend OUT_FOR_DELIVERY
 *   Backend DELIVERED → Frontend DELIVERED
 * =============================================================================
 */

import * as React from 'react'
import {
  orderApi,
  driverApi,
  staffApi,
  restaurantApi,
  ApiError,
  type Order,
  type Restaurant,
} from '@/lib/api'
import {
  toQueuedOrder,
  toAssignedOrder,
  toDriver,
  toStaff,
} from '@/lib/transforms/staff'

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
  // Loading and error state
  isLoading: boolean
  error: string | null
  // Data
  registrations: RegistrationRequest[]
  withdrawals: WithdrawalRequest[]
  activeRestaurants: string[]
  staff: Staff[]
  drivers: Driver[]
  orders: QueuedOrder[]            // Queue (PENDING orders)
  assignedOrders: StaffAssignedOrder[] // Staff working set (CONFIRMED+ orders)
  ordersToday: number
  // Restaurant lookup (for order display)
  restaurantMap: Record<number, string>
}

export type AdminActions = {
  // Data fetching
  fetchData: () => Promise<void>
  // Admin
  approveRegistration: (id: string) => Promise<void>
  rejectRegistration: (id: string) => Promise<void>
  approveWithdrawal: (id: string) => Promise<void>
  disapproveWithdrawal: (id: string) => Promise<void>
  addRegistrationRequest: (restaurantName: string, details?: RegistrationDetails) => void
  addWithdrawalRequest: (restaurantName: string, reason?: string) => void
  setRegistrationDetails: (id: string, details: RegistrationDetails) => void
  addStaff: (first: string, last: string) => Promise<{ first: string; last: string; username: string; password: string }>
  removeStaff: (id: string) => Promise<void>
  hireDriver: (name: string) => Promise<{ name: string }>
  fireDriver: (id: string) => Promise<void>

  // Staff workflow
  staffRetrieveFirstOrder: () => Promise<(StaffAssignedOrder & { status: OrderStatus }) | null>
  staffRetrieveOrderById: (orderId: string) => Promise<(StaffAssignedOrder & { status: OrderStatus }) | null>
  staffAssignDriver: (orderId: string, driverId: string, staffId: number) => Promise<void>
  staffMarkDelivered: (orderId: string, deliveredAtISO?: string) => Promise<void>
}

export type AdminMetrics = {
  activeRestaurants: number
  pendingRegistrations: number
  pendingWithdrawals: number
  ordersToday: number
  driversAvailable: number
  staffCount: number
}

// Context
const AdminStoreContext = React.createContext<{ state: AdminState; actions: AdminActions } | null>(null)

export function AdminStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AdminState>({
    isLoading: true,
    error: null,
    registrations: [],
    withdrawals: [],
    activeRestaurants: [],
    staff: [],
    drivers: [],
    orders: [],
    assignedOrders: [],
    ordersToday: 0,
    restaurantMap: {},
  })

  /**
   * Fetch all data from backend APIs.
   * Called on mount and after mutations to refresh state.
   */
  const fetchData = React.useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Fetch all data in parallel
      const [
        pendingOrders,
        confirmedOrders,
        outForDeliveryOrders,
        deliveredOrders,
        apiDrivers,
        apiStaff,
        pendingRestaurants,
        withdrawalRestaurants,
        allRestaurants,
      ] = await Promise.all([
        orderApi.getAll({ status: 'PENDING' }),
        orderApi.getAll({ status: 'CONFIRMED' }),
        orderApi.getAll({ status: 'OUT_FOR_DELIVERY' }),
        orderApi.getAll({ status: 'DELIVERED' }),
        driverApi.getAll(),
        staffApi.getAll(),
        restaurantApi.getAll().then(r => r.filter(rest => rest.account_status === 'PENDING')),
        restaurantApi.getWithdrawals(),
        restaurantApi.getAll(),
      ])

      // Build restaurant lookup map
      const restaurantMap: Record<number, string> = {}
      allRestaurants.forEach(r => { restaurantMap[r.restaurant_id] = r.restaurant_name })

      // Helper to get restaurant name from order
      const getRestaurantName = (order: Order) =>
        restaurantMap[order.restaurant_id] || `Restaurant #${order.restaurant_id}`

      // Transform orders
      const queuedOrders = pendingOrders.map(o => toQueuedOrder(o, getRestaurantName(o)))

      const assignedOrders = [
        ...confirmedOrders.map(o => toAssignedOrder(o, getRestaurantName(o))),
        ...outForDeliveryOrders.map(o => toAssignedOrder(o, getRestaurantName(o))),
        ...deliveredOrders
          .filter(o => {
            // Only show orders delivered today
            const deliveredDate = new Date(o.actual_delivery_time || o.created_at)
            const today = new Date()
            return deliveredDate.toDateString() === today.toDateString()
          })
          .map(o => toAssignedOrder(o, getRestaurantName(o))),
      ]

      // Transform registrations from pending restaurants
      const registrations: RegistrationRequest[] = pendingRestaurants.map(r => ({
        id: String(r.restaurant_id),
        restaurantName: r.restaurant_name,
        submittedAt: r.approved_at || new Date().toISOString(),
        status: 'PENDING' as const,
        details: {
          address: {
            street: r.street_address,
            city: r.city,
            state: r.state,
            zip: r.zip_code,
          },
          phone: r.phone_number,
        },
      }))

      // Transform withdrawals
      const withdrawals: WithdrawalRequest[] = withdrawalRestaurants.map(r => ({
        id: String(r.restaurant_id),
        restaurantName: r.restaurant_name,
        requestedAt: new Date().toISOString(),
        status: 'PENDING' as const,
        reason: 'Withdrawal requested',
      }))

      // Get active restaurants (APPROVED status)
      const activeRestaurants = allRestaurants
        .filter(r => r.account_status === 'APPROVED')
        .map(r => r.restaurant_name)

      // Count orders today
      const today = new Date().toDateString()
      const ordersToday = deliveredOrders.filter(o => {
        const orderDate = new Date(o.created_at)
        return orderDate.toDateString() === today
      }).length

      setState({
        isLoading: false,
        error: null,
        registrations,
        withdrawals,
        activeRestaurants,
        staff: apiStaff.map(toStaff),
        drivers: apiDrivers.map(toDriver),
        orders: queuedOrders,
        assignedOrders,
        ordersToday,
        restaurantMap,
      })
    } catch (err) {
      console.error('Failed to fetch admin data:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }))
    }
  }, [])

  // Fetch data on mount
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  // =========================================================================
  // Admin Actions
  // =========================================================================

  const approveRegistration: AdminActions['approveRegistration'] = async (id) => {
    try {
      await restaurantApi.approve(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to approve registration:', err)
      throw err
    }
  }

  const rejectRegistration: AdminActions['rejectRegistration'] = async (id) => {
    try {
      await restaurantApi.reject(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to reject registration:', err)
      throw err
    }
  }

  const approveWithdrawal: AdminActions['approveWithdrawal'] = async (id) => {
    try {
      await restaurantApi.approveWithdrawal(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to approve withdrawal:', err)
      throw err
    }
  }

  const disapproveWithdrawal: AdminActions['disapproveWithdrawal'] = async (id) => {
    try {
      await restaurantApi.rejectWithdrawal(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to disapprove withdrawal:', err)
      throw err
    }
  }

  // These remain local-only (no backend support yet)
  const addRegistrationRequest: AdminActions['addRegistrationRequest'] = (restaurantName, details) => {
    const name = restaurantName.trim()
    if (!name) return
    setState((prev) => {
      if (prev.activeRestaurants.includes(name)) return prev
      if (prev.registrations.some((r) => r.restaurantName.toLowerCase() === name.toLowerCase() && r.status === 'PENDING')) return prev
      const reg: RegistrationRequest = { id: `rq-${Date.now()}`, restaurantName: name, submittedAt: new Date().toISOString(), status: 'PENDING', details }
      return { ...prev, registrations: [reg, ...prev.registrations] }
    })
  }

  const addWithdrawalRequest: AdminActions['addWithdrawalRequest'] = (restaurantName, reason) => {
    const name = restaurantName.trim()
    if (!name) return
    setState((prev) => {
      if (!prev.activeRestaurants.includes(name)) return prev
      if (prev.withdrawals.some((w) => w.restaurantName === name && w.status === 'PENDING')) return prev
      const wd: WithdrawalRequest = { id: `wd-${Date.now()}`, restaurantName: name, requestedAt: new Date().toISOString(), status: 'PENDING', reason: reason?.trim() || 'No reason' }
      return { ...prev, withdrawals: [wd, ...prev.withdrawals], activeRestaurants: prev.activeRestaurants.filter((n) => n !== name) }
    })
  }

  const setRegistrationDetails: AdminActions['setRegistrationDetails'] = (id, details) => {
    setState((prev) => ({ ...prev, registrations: prev.registrations.map((r) => r.id === id ? { ...r, details: { ...r.details, ...details } } : r) }))
  }

  // =========================================================================
  // Staff & Driver CRUD
  // =========================================================================

  const addStaff: AdminActions['addStaff'] = async (first, last) => {
    const f = first.trim(), l = last.trim()
    if (!f || !l) return { first: f, last: l, username: '', password: '' }

    try {
      const result = await staffApi.create({ first_name: f, last_name: l })
      await fetchData()
      return {
        first: f,
        last: l,
        username: result.credentials.username,
        password: result.credentials.password,
      }
    } catch (err) {
      console.error('Failed to add staff:', err)
      throw err
    }
  }

  const removeStaff: AdminActions['removeStaff'] = async (id) => {
    try {
      await staffApi.delete(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to remove staff:', err)
      throw err
    }
  }

  const hireDriver: AdminActions['hireDriver'] = async (name) => {
    const n = name.trim()
    if (!n) return { name: n }

    try {
      await driverApi.hire(n)
      await fetchData()
      return { name: n }
    } catch (err) {
      console.error('Failed to hire driver:', err)
      throw err
    }
  }

  const fireDriver: AdminActions['fireDriver'] = async (id) => {
    try {
      await driverApi.fire(Number(id))
      await fetchData()
    } catch (err) {
      console.error('Failed to fire driver:', err)
      throw err
    }
  }

  // =========================================================================
  // Staff Order Workflow
  // =========================================================================

  /**
   * Retrieve the first order from the queue.
   * Changes order status from PENDING to CONFIRMED in backend.
   *
   * NOTE: Race condition possible if two staff click simultaneously.
   * Backend returns 409 Conflict if order was already claimed.
   */
  const staffRetrieveFirstOrder: AdminActions['staffRetrieveFirstOrder'] = async () => {
    const firstOrder = state.orders.find(o => o.status === 'QUEUED')
    if (!firstOrder) return null

    try {
      // Update status to CONFIRMED (staff has claimed it)
      const result = await orderApi.updateStatus(firstOrder.id, 'CONFIRMED')
      const restaurantName = state.restaurantMap[result.order.restaurant_id] || firstOrder.restaurantName

      // Refresh data to get updated lists
      await fetchData()

      // Return the assigned order for UI feedback
      return toAssignedOrder(result.order, restaurantName)
    } catch (err) {
      // Handle conflict - another staff member claimed it first
      if (err instanceof ApiError && err.status === 409) {
        await fetchData() // Refresh to see current state
        return null // Signal that order was taken
      }
      console.error('Failed to retrieve order:', err)
      throw err
    }
  }

  /**
   * Retrieve a specific order by ID from the queue.
   *
   * NOTE: Race condition possible if two staff click simultaneously.
   * Backend returns 409 Conflict if order was already claimed.
   */
  const staffRetrieveOrderById: AdminActions['staffRetrieveOrderById'] = async (orderId) => {
    const order = state.orders.find(o => o.id === orderId && o.status === 'QUEUED')
    if (!order) return null

    try {
      const result = await orderApi.updateStatus(orderId, 'CONFIRMED')
      const restaurantName = state.restaurantMap[result.order.restaurant_id] || order.restaurantName

      await fetchData()

      return toAssignedOrder(result.order, restaurantName)
    } catch (err) {
      // Handle conflict - another staff member claimed it first
      if (err instanceof ApiError && err.status === 409) {
        await fetchData() // Refresh to see current state
        return null // Signal that order was taken
      }
      console.error('Failed to retrieve order:', err)
      throw err
    }
  }

  /**
   * Assign a driver to an order (atomic operation).
   *
   * Uses the atomic /assign-and-dispatch endpoint which performs in a single transaction:
   * 1. Assigns driver to order
   * 2. Sets driver status to BUSY
   * 3. Updates order status to OUT_FOR_DELIVERY
   *
   * Returns 409 Conflict if driver is already BUSY or order already assigned.
   *
   * @param orderId - Order to assign
   * @param driverId - Driver to assign
   * @param staffId - ID of staff member making the assignment (from auth)
   */
  const staffAssignDriver: AdminActions['staffAssignDriver'] = async (orderId, driverId, staffId) => {
    try {
      // Atomic: assign driver + set driver BUSY + set order OUT_FOR_DELIVERY
      await orderApi.assignAndDispatch(orderId, Number(driverId), staffId)
      await fetchData()
    } catch (err) {
      // Handle race condition - driver or order state changed
      if (err instanceof ApiError && err.status === 409) {
        await fetchData() // Refresh to see current state
      }
      console.error('Failed to assign driver:', err)
      throw err
    }
  }

  /**
   * Mark an order as delivered (atomic operation).
   *
   * Uses the atomic /deliver endpoint which performs in a single transaction:
   * 1. Records actual delivery time
   * 2. Updates order status to DELIVERED
   * 3. Sets driver back to AVAILABLE
   *
   * Returns 409 Conflict if order already delivered, 400 if no driver assigned.
   */
  const staffMarkDelivered: AdminActions['staffMarkDelivered'] = async (orderId, deliveredAtISO) => {
    const deliveredAt = deliveredAtISO || new Date().toISOString()

    try {
      // Atomic: record delivery time + set DELIVERED + set driver AVAILABLE
      await orderApi.markDelivered(orderId, deliveredAt)
      await fetchData()
    } catch (err) {
      // Handle race condition - order already delivered
      if (err instanceof ApiError && err.status === 409) {
        await fetchData() // Refresh to see current state
      }
      console.error('Failed to mark delivered:', err)
      throw err
    }
  }

  const actions: AdminActions = {
    fetchData,
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
export function selectMetrics(state: AdminState): AdminMetrics {
  return {
    activeRestaurants: state.activeRestaurants.length,
    pendingRegistrations: state.registrations.filter((r) => r.status === 'PENDING').length,
    pendingWithdrawals: state.withdrawals.filter((w) => w.status === 'PENDING').length,
    ordersToday: state.ordersToday,
    driversAvailable: state.drivers.filter((d) => d.status !== 'ON_TRIP').length,
    staffCount: state.staff.length,
  }
}
