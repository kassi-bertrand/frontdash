/**
 * Checkout Flow Utilities
 * =============================================================================
 * Shared business logic for order totals calculation.
 *
 * IMPORTANT: This is the single source of truth for service charge rate
 * and order total calculations. Do NOT duplicate this logic elsewhere.
 * =============================================================================
 */

import type { RestaurantCart } from '@/stores/use-cart-store'

/** Service charge rate (8.25% sales tax) */
export const SERVICE_CHARGE_RATE = 0.0825

/** Maximum quantity allowed per item */
export const MAX_ITEM_QUANTITY = 99

export interface OrderTotals {
  subtotalCents: number
  serviceChargeCents: number
  tipCents: number
  grandTotalCents: number
}

/**
 * Calculates order totals from cart state.
 *
 * @param cart - Restaurant cart with items and tip
 * @returns Calculated totals in cents
 */
export function calculateOrderTotals(cart: RestaurantCart): OrderTotals {
  const subtotalCents = Object.values(cart.items).reduce(
    (acc, item) => acc + item.priceCents * item.quantity,
    0
  )

  const serviceChargeCents = Math.round(subtotalCents * SERVICE_CHARGE_RATE)

  const tipCents =
    cart.tip?.mode === 'percent'
      ? Math.round(subtotalCents * (cart.tip.percent / 100))
      : cart.tip?.mode === 'fixed'
        ? cart.tip.cents
        : 0

  return {
    subtotalCents,
    serviceChargeCents,
    tipCents,
    grandTotalCents: subtotalCents + serviceChargeCents + tipCents,
  }
}

/**
 * Creates an empty OrderTotals object (for when cart is empty/missing).
 */
export function emptyOrderTotals(): OrderTotals {
  return {
    subtotalCents: 0,
    serviceChargeCents: 0,
    tipCents: 0,
    grandTotalCents: 0,
  }
}
