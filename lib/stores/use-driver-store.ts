/**
 * Driver Store (Zustand)
 * =============================================================================
 * Manages driver state and CRUD operations.
 *
 * RESPONSIBILITIES:
 * - Fetch all drivers from backend
 * - Hire new drivers
 * - Fire existing drivers
 * - Track driver availability status
 *
 * USAGE:
 *   const { drivers, hireDriver, fireDriver } = useDriverStore()
 * =============================================================================
 */

import { create } from 'zustand'
import { driverApi, type Driver as ApiDriver } from '@/lib/api'
import type { DriverId } from '@/lib/types/ids'
import { toDriverId } from '@/lib/types/ids'

// =============================================================================
// Types
// =============================================================================

/** Driver status in the frontend */
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFFLINE'

/** Driver entity for UI */
export interface Driver {
  id: DriverId
  name: string
  status: DriverStatus
  hiredDate?: string
}

interface DriverState {
  /** All drivers in the system */
  drivers: Driver[]
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message if last operation failed */
  error: string | null
}

interface DriverActions {
  /** Fetch all drivers from the backend */
  fetchDrivers: () => Promise<void>
  /** Hire a new driver */
  hireDriver: (name: string) => Promise<Driver>
  /** Fire (remove) a driver */
  fireDriver: (driverId: DriverId) => Promise<void>
  /** Clear any error state */
  clearError: () => void
}

// =============================================================================
// Helpers
// =============================================================================

/**
 * Maps backend driver status to frontend status.
 * Backend: AVAILABLE, BUSY, OFFLINE
 * Frontend: AVAILABLE, ON_TRIP, OFFLINE
 */
function mapDriverStatus(backendStatus: ApiDriver['driver_status']): DriverStatus {
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

/** Transforms API driver to frontend Driver */
function toDriver(apiDriver: ApiDriver): Driver {
  return {
    id: toDriverId(apiDriver.driver_id),
    name: apiDriver.driver_name,
    status: mapDriverStatus(apiDriver.driver_status),
    hiredDate: apiDriver.hired_date,
  }
}

// =============================================================================
// Store
// =============================================================================

export const useDriverStore = create<DriverState & DriverActions>((set, get) => ({
  // Initial state
  drivers: [],
  isLoading: false,
  error: null,

  // Actions
  fetchDrivers: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const apiDrivers = await driverApi.getAll()
      set({
        drivers: apiDrivers.map(toDriver),
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch drivers'
      set({ error: message, isLoading: false })
    }
  },

  hireDriver: async (name: string): Promise<Driver> => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      throw new Error('Driver name is required')
    }

    try {
      const result = await driverApi.hire(trimmedName)
      const newDriver = toDriver(result.driver)

      // Refresh the full list to stay in sync
      await get().fetchDrivers()

      return newDriver
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to hire driver'
      set({ error: message })
      throw err
    }
  },

  fireDriver: async (driverId: DriverId): Promise<void> => {
    try {
      await driverApi.fire(driverId)
      // Refresh the full list to stay in sync
      await get().fetchDrivers()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fire driver'
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

/** Get count of available drivers */
export const selectAvailableDriverCount = (state: DriverState): number =>
  state.drivers.filter((d) => d.status === 'AVAILABLE').length

/** Get available drivers only */
export const selectAvailableDrivers = (state: DriverState): Driver[] =>
  state.drivers.filter((d) => d.status === 'AVAILABLE')
