/**
 * Restaurant Store (Zustand)
 * =============================================================================
 * Manages restaurant registrations, withdrawals, and active restaurant data.
 *
 * RESPONSIBILITIES:
 * - Fetch all restaurants and build lookup map
 * - Handle registration approvals/rejections
 * - Handle withdrawal approvals/rejections
 * - Track active restaurants
 *
 * USAGE:
 *   const { registrations, approveRegistration } = useRestaurantStore()
 * =============================================================================
 */

import { create } from 'zustand'
import { restaurantApi, type Restaurant as ApiRestaurant } from '@/lib/api'
import type { RestaurantId } from '@/lib/types/ids'
import { toRestaurantId } from '@/lib/types/ids'

// =============================================================================
// Types
// =============================================================================

export type RegistrationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'DISAPPROVED'

/** Address details for a restaurant */
export interface RestaurantAddress {
  street?: string
  city?: string
  state?: string
  zip?: string
}

/** Registration request from a restaurant wanting to join */
export interface RegistrationRequest {
  id: RestaurantId
  restaurantName: string
  submittedAt: string
  status: RegistrationStatus
  address?: RestaurantAddress
  phone?: string
}

/** Withdrawal request from a restaurant wanting to leave */
export interface WithdrawalRequest {
  id: RestaurantId
  restaurantName: string
  requestedAt: string
  status: WithdrawalStatus
  reason?: string
}

interface RestaurantState {
  /** Pending registration requests */
  registrations: RegistrationRequest[]
  /** Pending withdrawal requests */
  withdrawals: WithdrawalRequest[]
  /** Names of active (approved) restaurants */
  activeRestaurants: string[]
  /** Lookup map: restaurant ID → name */
  restaurantMap: Record<RestaurantId, string>
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message if last operation failed */
  error: string | null
}

interface RestaurantActions {
  /** Fetch all restaurant data from the backend */
  fetchRestaurants: () => Promise<void>
  /** Approve a registration request */
  approveRegistration: (id: RestaurantId) => Promise<void>
  /** Reject a registration request */
  rejectRegistration: (id: RestaurantId) => Promise<void>
  /** Approve a withdrawal request */
  approveWithdrawal: (id: RestaurantId) => Promise<void>
  /** Reject (disapprove) a withdrawal request */
  rejectWithdrawal: (id: RestaurantId) => Promise<void>
  /** Clear any error state */
  clearError: () => void
}

// =============================================================================
// Helpers
// =============================================================================

/** Transforms API restaurant to RegistrationRequest */
function toRegistrationRequest(apiRestaurant: ApiRestaurant): RegistrationRequest {
  return {
    id: toRestaurantId(apiRestaurant.restaurant_id),
    restaurantName: apiRestaurant.restaurant_name,
    submittedAt: apiRestaurant.approved_at || new Date().toISOString(),
    status: 'PENDING',
    address: {
      street: apiRestaurant.street_address,
      city: apiRestaurant.city,
      state: apiRestaurant.state,
      zip: apiRestaurant.zip_code,
    },
    phone: apiRestaurant.phone_number,
  }
}

/** Transforms API restaurant to WithdrawalRequest */
function toWithdrawalRequest(apiRestaurant: ApiRestaurant): WithdrawalRequest {
  return {
    id: toRestaurantId(apiRestaurant.restaurant_id),
    restaurantName: apiRestaurant.restaurant_name,
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
    reason: 'Withdrawal requested',
  }
}

// =============================================================================
// Store
// =============================================================================

export const useRestaurantStore = create<RestaurantState & RestaurantActions>((set, get) => ({
  // Initial state
  registrations: [],
  withdrawals: [],
  activeRestaurants: [],
  restaurantMap: {},
  isLoading: false,
  error: null,

  // Actions
  fetchRestaurants: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const [allRestaurants, withdrawalRestaurants] = await Promise.all([
        restaurantApi.getAll(),
        restaurantApi.getWithdrawals(),
      ])

      // Build restaurant lookup map
      const restaurantMap: Record<RestaurantId, string> = {}
      allRestaurants.forEach((r) => {
        restaurantMap[toRestaurantId(r.restaurant_id)] = r.restaurant_name
      })

      // Get pending registrations
      const registrations = allRestaurants
        .filter((r) => r.account_status === 'PENDING')
        .map(toRegistrationRequest)

      // Get pending withdrawals
      const withdrawals = withdrawalRestaurants.map(toWithdrawalRequest)

      // Get active restaurant names
      const activeRestaurants = allRestaurants
        .filter((r) => r.account_status === 'APPROVED')
        .map((r) => r.restaurant_name)

      set({
        registrations,
        withdrawals,
        activeRestaurants,
        restaurantMap,
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch restaurants'
      set({ error: message, isLoading: false })
    }
  },

  approveRegistration: async (id: RestaurantId): Promise<void> => {
    try {
      await restaurantApi.approve(id)
      await get().fetchRestaurants()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve registration'
      set({ error: message })
      throw err
    }
  },

  rejectRegistration: async (id: RestaurantId): Promise<void> => {
    try {
      await restaurantApi.reject(id)
      await get().fetchRestaurants()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject registration'
      set({ error: message })
      throw err
    }
  },

  approveWithdrawal: async (id: RestaurantId): Promise<void> => {
    try {
      await restaurantApi.approveWithdrawal(id)
      await get().fetchRestaurants()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve withdrawal'
      set({ error: message })
      throw err
    }
  },

  rejectWithdrawal: async (id: RestaurantId): Promise<void> => {
    try {
      await restaurantApi.rejectWithdrawal(id)
      await get().fetchRestaurants()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject withdrawal'
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

/** Get count of active restaurants */
export const selectActiveRestaurantCount = (state: RestaurantState): number =>
  state.activeRestaurants.length

/** Get count of pending registrations */
export const selectPendingRegistrationCount = (state: RestaurantState): number =>
  state.registrations.filter((r) => r.status === 'PENDING').length

/** Get count of pending withdrawals */
export const selectPendingWithdrawalCount = (state: RestaurantState): number =>
  state.withdrawals.filter((w) => w.status === 'PENDING').length

/** Get restaurant name by ID */
export const selectRestaurantName = (state: RestaurantState, id: RestaurantId): string =>
  state.restaurantMap[id] || `Restaurant #${id}`
