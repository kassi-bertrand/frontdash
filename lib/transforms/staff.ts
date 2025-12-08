/**
 * Staff Portal Data Transformers
 * =============================================================================
 * Converts backend API responses to frontend admin-store types.
 *
 * WHY THIS FILE EXISTS:
 * The backend returns database-shaped data (order_number, driver_status).
 * The admin-store uses UI-shaped types (id, status: 'ON_TRIP').
 * These functions bridge that gap.
 *
 * USAGE:
 *   import { toQueuedOrder, toDriver, toStaff } from '@/lib/transforms/staff'
 *   const orders = apiOrders.map(toQueuedOrder)
 * =============================================================================
 */

import type { Order, Driver as ApiDriver, Staff as ApiStaff } from '@/lib/api'
import type {
  QueuedOrder,
  StaffAssignedOrder,
  Driver,
  Staff,
  OrderStatus,
} from '@/app/(dashboard)/admin/_state/admin-store'

/**
 * Maps backend order status to frontend order status.
 *
 * Backend: PENDING, CONFIRMED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, CANCELLED
 * Frontend: QUEUED, ASSIGNED, OUT_FOR_DELIVERY, DELIVERED
 */
function mapOrderStatus(backendStatus: Order['order_status']): OrderStatus {
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
      // Treat cancelled as delivered (won't show in active lists)
      return 'DELIVERED'
    default:
      return 'QUEUED'
  }
}

/**
 * Maps backend driver status to frontend driver status.
 *
 * Backend: AVAILABLE, BUSY, OFFLINE
 * Frontend: AVAILABLE, ON_TRIP, OFFLINE
 */
function mapDriverStatus(backendStatus: ApiDriver['driver_status']): Driver['status'] {
  switch (backendStatus) {
    case 'AVAILABLE':
      return 'AVAILABLE'
    case 'BUSY':
      return 'ON_TRIP'
    case 'OFFLINE':
      return 'OFFLINE'
    default:
      return 'AVAILABLE'
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
 * Converts a backend Order to a frontend QueuedOrder.
 *
 * Use this for orders in the queue (PENDING status).
 *
 * @param order - Order from the API
 * @param restaurantName - Restaurant name (looked up separately or passed in)
 */
export function toQueuedOrder(order: Order, restaurantName: string): QueuedOrder {
  return {
    id: order.order_number,
    restaurantName,
    placedAt: order.created_at,
    etaMinutes: calculateEtaMinutes(order.estimated_delivery_time, order.created_at),
    status: mapOrderStatus(order.order_status),
  }
}

/**
 * Converts a backend Order to a frontend StaffAssignedOrder.
 *
 * Use this for orders that have been claimed by staff (CONFIRMED+ status).
 *
 * @param order - Order from the API
 * @param restaurantName - Restaurant name (looked up separately or passed in)
 */
export function toAssignedOrder(order: Order, restaurantName: string): StaffAssignedOrder {
  return {
    id: order.order_number,
    restaurantName,
    placedAt: order.created_at,
    etaMinutes: calculateEtaMinutes(order.estimated_delivery_time, order.created_at),
    estimatedDeliveryAt: order.estimated_delivery_time,
    // Use created_at as assignedAt approximation (backend doesn't track this separately)
    assignedAt: order.created_at,
    driverId: order.assigned_driver_id ? String(order.assigned_driver_id) : undefined,
    deliveredAt: order.actual_delivery_time,
    status: mapOrderStatus(order.order_status),
  }
}

/**
 * Converts a backend Driver to a frontend Driver.
 */
export function toDriver(driver: ApiDriver): Driver {
  return {
    id: String(driver.driver_id),
    name: driver.driver_name,
    status: mapDriverStatus(driver.driver_status),
  }
}

/**
 * Converts a backend Staff to a frontend Staff.
 */
export function toStaff(staff: ApiStaff): Staff {
  return {
    id: String(staff.staff_id),
    firstName: staff.first_name,
    lastName: staff.last_name,
    username: staff.username,
    email: `${staff.username}@frontdash.app`,
  }
}
