/**
 * Order Store (Zustand)
 * =============================================================================
 * Manages order queue, staff workflow, and delivery operations.
 *
 * RESPONSIBILITIES:
 * - Fetch orders in various states (queue, assigned, delivered)
 * - Staff order retrieval (claim from queue)
 * - Driver assignment to orders
 * - Delivery confirmation
 *
 * ORDER STATUS MAPPING:
 *   Backend PENDING → Frontend QUEUED (in queue, not claimed)
 *   Backend CONFIRMED → Frontend ASSIGNED (staff claimed it)
 *   Backend OUT_FOR_DELIVERY → Frontend OUT_FOR_DELIVERY
 *   Backend DELIVERED → Frontend DELIVERED
 *
 * USAGE:
 *   const { queuedOrders, retrieveFirstOrder } = useOrderStore()
 * =============================================================================
 */

import { create } from 'zustand'
import { orderApi, ApiError, type Order as ApiOrder } from '@/lib/api'
import type { OrderId, DriverId, StaffId, RestaurantId } from '@/lib/types/ids'
import { toOrderId, toDriverId, toRestaurantId } from '@/lib/types/ids'

// =============================================================================
// Types
// =============================================================================

/** Order status in the frontend */
export type OrderStatus = 'QUEUED' | 'ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED'

/** Order in the queue (not yet claimed by staff) */
export interface QueuedOrder {
  id: OrderId
  restaurantId: number
  restaurantName: string
  placedAt: string
  etaMinutes?: number
  status: OrderStatus
}

/** Order claimed by staff (being processed or delivered) */
export interface AssignedOrder {
  id: OrderId
  restaurantId: number
  restaurantName: string
  placedAt: string
  etaMinutes?: number
  estimatedDeliveryAt?: string
  assignedAt: string
  driverId?: DriverId
  deliveredAt?: string
  status: OrderStatus
}

interface OrderState {
  /** Orders in the queue (PENDING status) */
  queuedOrders: QueuedOrder[]
  /** Orders claimed by staff (CONFIRMED+ status) */
  assignedOrders: AssignedOrder[]
  /** Count of orders delivered today */
  ordersDeliveredToday: number
  /** Restaurant ID → name lookup (populated from restaurants) */
  restaurantMap: Record<RestaurantId, string>
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message if last operation failed */
  error: string | null
}

interface OrderActions {
  /** Fetch all orders and restaurant data from the backend */
  fetchOrders: () => Promise<void>
  /** Set restaurant map (called from restaurant store or externally) */
  setRestaurantMap: (map: Record<RestaurantId, string>) => void
  /**
   * Retrieve the first order from the queue.
   * Returns the claimed order, or null if queue is empty or order was taken.
   */
  retrieveFirstOrder: () => Promise<AssignedOrder | null>
  /**
   * Retrieve a specific order from the queue by ID.
   * Returns the claimed order, or null if not found or already taken.
   */
  retrieveOrderById: (orderId: OrderId) => Promise<AssignedOrder | null>
  /**
   * Assign a driver to an order (atomic operation).
   * Sets driver to BUSY and order to OUT_FOR_DELIVERY.
   */
  assignDriver: (orderId: OrderId, driverId: DriverId, staffId: StaffId) => Promise<void>
  /**
   * Mark an order as delivered (atomic operation).
   * Records delivery time, sets order to DELIVERED, driver back to AVAILABLE.
   */
  markDelivered: (orderId: OrderId, deliveredAtISO: string) => Promise<void>
  /** Clear any error state */
  clearError: () => void
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Maps backend order status to frontend order status.
 */
function mapOrderStatus(backendStatus: ApiOrder['order_status']): OrderStatus {
  switch (backendStatus) {
    case 'PENDING':
      return 'QUEUED'
    case 'CONFIRMED':
    case 'PREPARING':
      return 'ASSIGNED'
    case 'OUT_FOR_DELIVERY':
      return 'OUT_FOR_DELIVERY'
    case 'DELIVERED':
      return 'DELIVERED'
    case 'CANCELLED':
      return 'DELIVERED' // Treat cancelled as delivered (won't show in active lists)
    default:
      return 'QUEUED'
  }
}

/**
 * Calculates ETA in minutes from estimated_delivery_time.
 */
function calculateEtaMinutes(estimatedDeliveryTime: string, placedAt: string): number {
  const eta = new Date(estimatedDeliveryTime).getTime()
  const placed = new Date(placedAt).getTime()
  const diffMs = eta - placed
  return Math.max(0, Math.round(diffMs / 60000))
}

/**
 * Transforms API order to frontend QueuedOrder.
 */
function toQueuedOrder(order: ApiOrder, restaurantName: string): QueuedOrder {
  return {
    id: toOrderId(order.order_number),
    restaurantId: order.restaurant_id,
    restaurantName,
    placedAt: order.created_at,
    etaMinutes: calculateEtaMinutes(order.estimated_delivery_time, order.created_at),
    status: mapOrderStatus(order.order_status),
  }
}

/**
 * Transforms API order to frontend AssignedOrder.
 */
function toAssignedOrder(order: ApiOrder, restaurantName: string): AssignedOrder {
  return {
    id: toOrderId(order.order_number),
    restaurantId: order.restaurant_id,
    restaurantName,
    placedAt: order.created_at,
    etaMinutes: calculateEtaMinutes(order.estimated_delivery_time, order.created_at),
    estimatedDeliveryAt: order.estimated_delivery_time,
    assignedAt: order.created_at, // Approximation (backend doesn't track separately)
    driverId: order.assigned_driver_id ? toDriverId(order.assigned_driver_id) : undefined,
    deliveredAt: order.actual_delivery_time,
    status: mapOrderStatus(order.order_status),
  }
}

/**
 * Checks if an order was delivered today.
 */
function isDeliveredToday(order: ApiOrder): boolean {
  const deliveredDate = new Date(order.actual_delivery_time || order.created_at)
  const today = new Date()
  return deliveredDate.toDateString() === today.toDateString()
}

// =============================================================================
// Store
// =============================================================================

export const useOrderStore = create<OrderState & OrderActions>((set, get) => ({
  // Initial state
  queuedOrders: [],
  assignedOrders: [],
  ordersDeliveredToday: 0,
  restaurantMap: {},
  isLoading: false,
  error: null,

  // Actions
  fetchOrders: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const [pendingOrders, confirmedOrders, outForDeliveryOrders, deliveredOrders] =
        await Promise.all([
          orderApi.getAll({ status: 'PENDING' }),
          orderApi.getAll({ status: 'CONFIRMED' }),
          orderApi.getAll({ status: 'OUT_FOR_DELIVERY' }),
          orderApi.getAll({ status: 'DELIVERED' }),
        ])

      const { restaurantMap } = get()
      const getRestaurantName = (order: ApiOrder): string =>
        restaurantMap[toRestaurantId(order.restaurant_id)] || `Restaurant #${order.restaurant_id}`

      // Transform queued orders
      const queuedOrders = pendingOrders.map((o) => toQueuedOrder(o, getRestaurantName(o)))

      // Transform assigned orders (CONFIRMED + OUT_FOR_DELIVERY + today's DELIVERED)
      const assignedOrders = [
        ...confirmedOrders.map((o) => toAssignedOrder(o, getRestaurantName(o))),
        ...outForDeliveryOrders.map((o) => toAssignedOrder(o, getRestaurantName(o))),
        ...deliveredOrders.filter(isDeliveredToday).map((o) => toAssignedOrder(o, getRestaurantName(o))),
      ]

      // Count orders delivered today (using actual delivery time, not created_at)
      const todayString = new Date().toDateString()
      const ordersDeliveredToday = deliveredOrders.filter((o) => {
        const deliveredDate = new Date(o.actual_delivery_time || o.created_at)
        return deliveredDate.toDateString() === todayString
      }).length

      set({
        queuedOrders,
        assignedOrders,
        ordersDeliveredToday,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch orders'
      set({ error: message, isLoading: false })
    }
  },

  setRestaurantMap: (map: Record<RestaurantId, string>): void => {
    set({ restaurantMap: map })
  },

  retrieveFirstOrder: async (): Promise<AssignedOrder | null> => {
    const { queuedOrders, restaurantMap } = get()
    const firstOrder = queuedOrders.find((o) => o.status === 'QUEUED')
    if (!firstOrder) return null

    try {
      const result = await orderApi.updateStatus(firstOrder.id, 'CONFIRMED')
      const restaurantName = restaurantMap[toRestaurantId(result.order.restaurant_id)] || firstOrder.restaurantName

      // Refresh data to get updated lists
      await get().fetchOrders()

      return toAssignedOrder(result.order, restaurantName)
    } catch (err) {
      // Handle conflict - another staff member claimed it first
      if (err instanceof ApiError && err.status === 409) {
        await get().fetchOrders() // Refresh to see current state
        return null // Signal that order was taken
      }
      const message = err instanceof Error ? err.message : 'Failed to retrieve order'
      set({ error: message })
      throw err
    }
  },

  retrieveOrderById: async (orderId: OrderId): Promise<AssignedOrder | null> => {
    const { queuedOrders, restaurantMap } = get()
    const order = queuedOrders.find((o) => o.id === orderId && o.status === 'QUEUED')
    if (!order) return null

    try {
      const result = await orderApi.updateStatus(orderId, 'CONFIRMED')
      const restaurantName = restaurantMap[toRestaurantId(result.order.restaurant_id)] || order.restaurantName

      await get().fetchOrders()

      return toAssignedOrder(result.order, restaurantName)
    } catch (err) {
      // Handle conflict - another staff member claimed it first
      if (err instanceof ApiError && err.status === 409) {
        await get().fetchOrders()
        return null
      }
      const message = err instanceof Error ? err.message : 'Failed to retrieve order'
      set({ error: message })
      throw err
    }
  },

  assignDriver: async (orderId: OrderId, driverId: DriverId, staffId: StaffId): Promise<void> => {
    try {
      // Atomic: assign driver + set driver BUSY + set order OUT_FOR_DELIVERY
      await orderApi.assignAndDispatch(orderId, driverId, staffId)
      await get().fetchOrders()
    } catch (err) {
      // Handle race condition - driver or order state changed
      if (err instanceof ApiError && err.status === 409) {
        await get().fetchOrders()
      }
      const message = err instanceof Error ? err.message : 'Failed to assign driver'
      set({ error: message })
      throw err
    }
  },

  markDelivered: async (orderId: OrderId, deliveredAtISO: string): Promise<void> => {
    try {
      // Atomic: record delivery time + set DELIVERED + set driver AVAILABLE
      await orderApi.markDelivered(orderId, deliveredAtISO)
      await get().fetchOrders()
    } catch (err) {
      // Handle race condition - order already delivered
      if (err instanceof ApiError && err.status === 409) {
        await get().fetchOrders()
      }
      const message = err instanceof Error ? err.message : 'Failed to mark delivered'
      set({ error: message })
      throw err
    }
  },

  clearError: (): void => {
    set({ error: null })
  },
}))

// =============================================================================
// Selectors
// =============================================================================

/** Get count of orders in queue */
export const selectQueueCount = (state: OrderState): number => state.queuedOrders.length

/** Get active (non-delivered) assigned orders */
export const selectActiveOrders = (state: OrderState): AssignedOrder[] =>
  state.assignedOrders.filter((o) => o.status !== 'DELIVERED')

/** Get delivered assigned orders */
export const selectDeliveredOrders = (state: OrderState): AssignedOrder[] =>
  state.assignedOrders.filter((o) => o.status === 'DELIVERED')
