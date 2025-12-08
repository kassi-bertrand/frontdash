/**
 * useStaffOrderActions Hook
 * =============================================================================
 * Encapsulates staff order workflow actions: retrieve, assign driver, deliver.
 * Handles auth checks, password change enforcement, and toast notifications.
 * =============================================================================
 */

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { useOrderStore, useDriverStore, useRestaurantStore } from '@/lib/stores'
import { useAuth, isStaffUser } from '@/hooks/use-auth'
import { parseTimeToISO } from '@/lib/utils'
import type { OrderId, DriverId, StaffId } from '@/lib/types/ids'
import { toOrderId, toDriverId, toStaffId } from '@/lib/types/ids'

export function useStaffOrderActions() {
  const { user } = useAuth()

  // Zustand stores
  const orderStore = useOrderStore()
  const driverStore = useDriverStore()
  const restaurantStore = useRestaurantStore()

  // Initialize data on mount - use getState() to avoid stale closures
  useEffect(() => {
    // Fetch restaurant data first (needed for order restaurant names)
    useRestaurantStore.getState().fetchRestaurants().then(() => {
      // Access fresh state after fetch completes
      const { restaurantMap } = useRestaurantStore.getState()
      useOrderStore.getState().setRestaurantMap(restaurantMap)
      useOrderStore.getState().fetchOrders()
    })
    useDriverStore.getState().fetchDrivers()
  }, [])

  // Keep restaurant map in sync
  useEffect(() => {
    if (Object.keys(restaurantStore.restaurantMap).length > 0) {
      useOrderStore.getState().setRestaurantMap(restaurantStore.restaurantMap)
    }
  }, [restaurantStore.restaurantMap])

  // Staff must change password before taking actions
  const mustChangePwd = isStaffUser(user) && user.mustChangePassword
  const canAct = isStaffUser(user) && !mustChangePwd

  // Form state for driver assignment and delivery time
  const [assigning, setAssigning] = useState<Record<string, string>>({})
  const [deliveredHHMM, setDeliveredHHMM] = useState<Record<string, string>>({})

  /**
   * Claims the first available order from the queue.
   * Requires password change if user hasn't updated their initial password.
   * @returns The claimed order, or null if queue is empty or order was taken
   */
  async function retrieveFirst() {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings first.')
      return null
    }
    try {
      const res = await orderStore.retrieveFirstOrder()
      if (!res) {
        toast.warning('No orders in queue (or order was just taken).')
        return null
      }
      toast.success(`Retrieved order ${res.id}`)
      return res
    } catch {
      toast.error('Failed to retrieve order.')
      return null
    }
  }

  /**
   * Claims a specific order from the queue by ID.
   * @param orderId - The order ID to retrieve
   * @returns The claimed order, or null if not found or already taken
   */
  async function retrieveById(orderId: string) {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings first.')
      return null
    }
    try {
      const res = await orderStore.retrieveOrderById(toOrderId(orderId))
      if (!res) {
        toast.error('Order not found in queue (maybe already taken).')
        return null
      }
      toast.success(`Retrieved order ${orderId}`)
      return res
    } catch {
      toast.error('Failed to retrieve order.')
      return null
    }
  }

  /**
   * Assigns a driver to an order and dispatches for delivery.
   * Sets driver status to BUSY and order status to OUT_FOR_DELIVERY.
   * @param orderId - The order to assign
   * @param preselectedDriverId - Optional driver ID (uses form state if not provided)
   * @returns true if successful, false otherwise
   */
  async function assignDriver(orderId: string, preselectedDriverId?: string) {
    if (!canAct) {
      toast.warning('Please change your password in Settings first.')
      return false
    }
    if (!isStaffUser(user)) {
      toast.error('Staff authentication required.')
      return false
    }

    const driverIdStr = preselectedDriverId || assigning[orderId]
    if (!driverIdStr) {
      toast.error('Select a driver first.')
      return false
    }

    try {
      await orderStore.assignDriver(
        toOrderId(orderId),
        toDriverId(Number(driverIdStr)),
        toStaffId(user.staffId)
      )
      // Also refresh drivers to update their status
      await driverStore.fetchDrivers()
      toast.success('Driver assigned.')
      setAssigning((m) => ({ ...m, [orderId]: '' }))
      return true
    } catch {
      toast.error('Failed to assign driver.')
      return false
    }
  }

  /**
   * Records delivery completion for an order.
   * Sets order status to DELIVERED and driver status back to AVAILABLE.
   * @param orderId - The order to mark as delivered
   * @param driverId - The assigned driver (for validation)
   * @returns true if successful, false otherwise
   */
  async function markDelivered(orderId: string, driverId?: string | number) {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings first.')
      return false
    }
    if (!driverId) {
      toast.error('Assign a driver before confirming delivery.')
      return false
    }

    const hhmm = deliveredHHMM[orderId]
    if (!hhmm) {
      toast.error('Enter delivered time as HH:MM (24h).')
      return false
    }

    const iso = parseTimeToISO(hhmm)
    if (!iso) {
      toast.error('Time must be HH:MM in 24-hour format.')
      return false
    }

    try {
      await orderStore.markDelivered(toOrderId(orderId), iso)
      // Also refresh drivers to update their status
      await driverStore.fetchDrivers()
      toast.success('Delivery recorded.')
      setDeliveredHHMM((m) => ({ ...m, [orderId]: '' }))
      return true
    } catch {
      toast.error('Failed to record delivery.')
      return false
    }
  }

  // Mapped drivers with string IDs for consumer compatibility
  const mappedDrivers = driverStore.drivers.map((d) => ({
    id: String(d.id),
    name: d.name,
    status: d.status,
  }))

  return {
    // Legacy state object (deprecated - use drivers directly)
    state: { drivers: mappedDrivers },

    // Data
    drivers: mappedDrivers,
    orders: orderStore.queuedOrders.map((o) => ({
      id: o.id as string,
      restaurantName: o.restaurantName,
      placedAt: o.placedAt,
      etaMinutes: o.etaMinutes,
      status: o.status,
    })),
    assignedOrders: orderStore.assignedOrders.map((o) => ({
      id: o.id as string,
      restaurantName: o.restaurantName,
      placedAt: o.placedAt,
      etaMinutes: o.etaMinutes,
      estimatedDeliveryAt: o.estimatedDeliveryAt,
      assignedAt: o.assignedAt,
      driverId: o.driverId ? String(o.driverId) : undefined,
      deliveredAt: o.deliveredAt,
      status: o.status,
    })),

    // Auth state
    mustChangePwd,
    canAct,

    // Form state
    assigning,
    setAssigning,
    deliveredHHMM,
    setDeliveredHHMM,

    // Actions
    retrieveFirst,
    retrieveById,
    assignDriver,
    markDelivered,
  }
}
