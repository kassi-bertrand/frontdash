/**
 * Customer-Facing Types
 * =============================================================================
 * Types used by customer-facing pages (homepage, restaurant detail, checkout).
 *
 * These types represent how data is DISPLAYED to customers, not how it's
 * stored in the database. The transforms in lib/transforms/restaurant.ts
 * convert backend API responses to these types.
 *
 * WHY SEPARATE FROM API TYPES:
 * - API types mirror database structure (restaurant_id, item_price in dollars)
 * - Customer types mirror UI needs (id as string, priceCents, slug)
 * - Keeping them separate makes each layer easier to understand
 * =============================================================================
 */

/**
 * A menu item as displayed to customers.
 *
 * @property priceCents - Price in cents (not dollars) for accurate math
 * @property isAvailable - Whether the item can be ordered right now
 */
export type RestaurantMenuItem = {
  id: string
  name: string
  description?: string
  priceCents: number
  imageUrl?: string
  isAvailable: boolean
}

/**
 * A group of menu items under a common heading.
 *
 * @example { title: "Appetizers", items: [...] }
 */
export type RestaurantMenuSection = {
  title: string
  items: RestaurantMenuItem[]
}

/**
 * A restaurant as displayed on the homepage and detail pages.
 *
 * This is the "display shape" of a restaurant - optimized for rendering
 * in the UI rather than database storage.
 *
 * @property slug - URL-friendly identifier (e.g., "joes-pizza")
 * @property priceTier - Price indicator for quick scanning
 * @property menu - Grouped menu data for the detail page
 */
export type CustomerRestaurant = {
  id: string
  slug: string
  name: string
  imageUrl?: string
  cuisine: string
  neighborhood: string
  priceTier: '$' | '$$' | '$$$' | '$$$$'
  rating: number
  reviewCount: number
  isOpen: boolean
  tags: string[]
  shortDescription: string
  menu: RestaurantMenuSection[]
}
