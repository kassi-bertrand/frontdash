/**
 * Restaurant Data Transformers
 * =============================================================================
 * Converts backend API responses to frontend display types.
 *
 * WHY THIS FILE EXISTS:
 * The backend returns database-shaped data (restaurant_id, item_price in dollars).
 * The frontend expects display-shaped data (id as string, priceCents, slug).
 * These functions bridge that gap so components stay clean.
 *
 * USAGE:
 *   import { toCustomerRestaurant } from '@/lib/transforms/restaurant'
 *   const displayData = toCustomerRestaurant(apiRestaurant, apiMenuItems)
 * =============================================================================
 */

import type { Restaurant, MenuItem, OperatingHours } from '@/lib/api'
import type {
  CustomerRestaurant,
  RestaurantMenuItem,
  RestaurantMenuSection,
} from '@/lib/types/customer'

/**
 * Default values for fields the backend doesn't yet provide.
 * Centralized here so they're easy to find and update.
 */
const PLACEHOLDER_DEFAULTS = {
  cuisine: 'Restaurant',
  fallbackNeighborhood: 'Local',
  priceTier: '$$' as const,
  rating: 4.5,
  reviewCount: 0,
} as const

/**
 * Maps JavaScript day index (0=Sunday) to backend day names.
 */
const DAY_INDEX_TO_NAME: Record<number, OperatingHours['day_of_week']> = {
  0: 'SUNDAY',
  1: 'MONDAY',
  2: 'TUESDAY',
  3: 'WEDNESDAY',
  4: 'THURSDAY',
  5: 'FRIDAY',
  6: 'SATURDAY',
}

/**
 * Calculates if a restaurant is currently open based on operating hours.
 *
 * @param hours - Operating hours from the API
 * @returns true if open now, false otherwise (defaults to closed)
 */
function calculateIsOpen(hours: OperatingHours[]): boolean {
  if (!hours || hours.length === 0) {
    return false // No hours defined = closed
  }

  const now = new Date()
  const currentDay = DAY_INDEX_TO_NAME[now.getDay()]
  const currentTime = now.toTimeString().slice(0, 5) // "HH:MM" format

  // Find today's hours
  const todayHours = hours.find((h) => h.day_of_week === currentDay)

  if (!todayHours) {
    return false // No hours for today = closed
  }

  if (todayHours.is_closed) {
    return false // Explicitly marked as closed
  }

  if (!todayHours.opening_time || !todayHours.closing_time) {
    return false // No times set = closed
  }

  // Compare current time with opening/closing times
  // Times are in "HH:MM:SS" format, we compare as strings (works for 24h format)
  const openTime = todayHours.opening_time.slice(0, 5)
  const closeTime = todayHours.closing_time.slice(0, 5)

  return currentTime >= openTime && currentTime < closeTime
}

/**
 * Creates a URL-friendly slug from a restaurant name.
 *
 * IMPORTANT: This logic MUST match the backend SQL in
 * backend/api/server.ts GET /api/restaurants/by-slug/:slug
 * If you change this, update the backend too!
 *
 * @example
 * toSlug("Citrus & Thyme") // "citrus-and-thyme"
 * toSlug("Joe's Pizza")    // "joes-pizza"
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')        // "Citrus & Thyme" -> "citrus and thyme"
    .replace(/'/g, '')           // "Joe's" -> "joes"
    .replace(/[^a-z0-9]+/g, '-') // spaces/punctuation -> hyphens
    .replace(/^-|-$/g, '')       // trim leading/trailing hyphens
}

/**
 * Converts a backend MenuItem to a frontend RestaurantMenuItem.
 *
 * Key transformations:
 * - menu_item_id (number) -> id (string)
 * - item_price (dollars) -> priceCents (multiply by 100)
 * - availability_status enum -> isAvailable boolean
 */
export function toRestaurantMenuItem(item: MenuItem): RestaurantMenuItem {
  return {
    id: String(item.menu_item_id),
    name: item.item_name,
    description: item.item_description,
    // Convert dollars to cents. Math.round() handles floating-point
    // precision issues (e.g., 19.99 * 100 = 1998.9999999999998)
    priceCents: Math.round(item.item_price * 100),
    imageUrl: item.item_image_url,
    isAvailable: item.availability_status === 'AVAILABLE',
  }
}

/**
 * Groups menu items into sections for display.
 *
 * Since the backend doesn't have menu categories yet, this creates
 * a single "Menu" section containing all items. When the backend
 * adds categories, update this function to group by category.
 *
 * @param items - Raw menu items from the API
 * @returns Array of menu sections for the restaurant detail page
 */
export function groupMenuIntoSections(items: MenuItem[]): RestaurantMenuSection[] {
  if (items.length === 0) {
    return []
  }

  // TODO: When backend adds categories, group items by category
  // For now, put all items in a single "Menu" section
  return [
    {
      title: 'Menu',
      items: items.map(toRestaurantMenuItem),
    },
  ]
}

/**
 * Converts a backend Restaurant + its menu items to a CustomerRestaurant.
 *
 * This is the main transformer used by the homepage and detail pages.
 *
 * PLACEHOLDER VALUES:
 * The backend doesn't yet have these fields, so we use sensible defaults:
 * - cuisine: "Restaurant" (generic)
 * - neighborhood: Uses city from address
 * - priceTier: "$$" (mid-range default)
 * - rating: 4.5 (good default for new restaurants)
 * - reviewCount: 0 (no reviews yet)
 * - shortDescription: Generated from name and city
 *
 * isOpen is calculated from operating hours (defaults to closed if no hours).
 */
export function toCustomerRestaurant(
  restaurant: Restaurant,
  menuItems: MenuItem[] = [],
  operatingHours: OperatingHours[] = []
): CustomerRestaurant {
  const slug = toSlug(restaurant.restaurant_name)

  return {
    id: String(restaurant.restaurant_id),
    slug,
    name: restaurant.restaurant_name,
    imageUrl: restaurant.restaurant_image_url || undefined,

    // Placeholder values from PLACEHOLDER_DEFAULTS - update when backend supports these
    cuisine: PLACEHOLDER_DEFAULTS.cuisine,
    neighborhood: restaurant.city || PLACEHOLDER_DEFAULTS.fallbackNeighborhood,
    priceTier: PLACEHOLDER_DEFAULTS.priceTier,
    rating: PLACEHOLDER_DEFAULTS.rating,
    reviewCount: PLACEHOLDER_DEFAULTS.reviewCount,
    // Calculate open/closed from real operating hours
    isOpen: calculateIsOpen(operatingHours),
    // Tags for filtering/display (city already shown via neighborhood)
    tags: [],
    shortDescription: `Welcome to ${restaurant.restaurant_name} in ${restaurant.city || PLACEHOLDER_DEFAULTS.fallbackNeighborhood}.`,

    // Menu data from API
    menu: groupMenuIntoSections(menuItems),
  }
}

