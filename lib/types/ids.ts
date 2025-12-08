/**
 * Branded ID Types
 * =============================================================================
 * Type-safe ID wrappers that prevent mixing up different entity IDs.
 * Includes runtime validation to ensure IDs are valid.
 *
 * USAGE:
 *   const orderId = toOrderId('ORD-123')
 *   const driverId = toDriverId(42)
 *
 * COMPILE-TIME SAFETY:
 *   function assignDriver(orderId: OrderId, driverId: DriverId) { ... }
 *   // TypeScript will error if you accidentally swap parameters
 *
 * RUNTIME SAFETY:
 *   toDriverId(-1)  // Throws Error: Invalid DriverId
 *   toOrderId('')   // Throws Error: Invalid OrderId
 * =============================================================================
 */

/** Order ID (string format: "ORD-12345" or similar) */
export type OrderId = string & { readonly __brand: 'OrderId' }

/** Driver ID (positive integer) */
export type DriverId = number & { readonly __brand: 'DriverId' }

/** Staff member ID (positive integer) */
export type StaffId = number & { readonly __brand: 'StaffId' }

/** Restaurant ID (positive integer) */
export type RestaurantId = number & { readonly __brand: 'RestaurantId' }

/**
 * Creates a validated OrderId from a string.
 * @throws Error if the ID is empty or not a string
 */
export function toOrderId(id: string): OrderId {
  if (!id || typeof id !== 'string') {
    throw new Error(`Invalid OrderId: ${id}`)
  }
  return id as OrderId
}

/**
 * Creates a validated DriverId from a number.
 * @throws Error if the ID is not a positive integer
 */
export function toDriverId(id: number): DriverId {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`Invalid DriverId: ${id}`)
  }
  return id as DriverId
}

/**
 * Creates a validated StaffId from a number.
 * @throws Error if the ID is not a positive integer
 */
export function toStaffId(id: number): StaffId {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`Invalid StaffId: ${id}`)
  }
  return id as StaffId
}

/**
 * Creates a validated RestaurantId from a number.
 * @throws Error if the ID is not a positive integer
 */
export function toRestaurantId(id: number): RestaurantId {
  if (!Number.isInteger(id) || id < 1) {
    throw new Error(`Invalid RestaurantId: ${id}`)
  }
  return id as RestaurantId
}
