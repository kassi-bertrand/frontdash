/**
 * Staff Store (Zustand)
 * =============================================================================
 * Manages staff member state and CRUD operations.
 *
 * RESPONSIBILITIES:
 * - Fetch all staff members from backend
 * - Add new staff members (returns credentials)
 * - Remove staff members
 *
 * USAGE:
 *   const { staffMembers, addStaffMember, removeStaffMember } = useStaffStore()
 * =============================================================================
 */

import { create } from 'zustand'
import { staffApi, type Staff as ApiStaff } from '@/lib/api'
import type { StaffId } from '@/lib/types/ids'
import { toStaffId } from '@/lib/types/ids'

// =============================================================================
// Types
// =============================================================================

/** Staff member entity for UI */
export interface StaffMember {
  id: StaffId
  firstName: string
  lastName: string
  username: string
  email: string
  isFirstLogin: boolean
  createdAt: string
}

/** Credentials returned when creating a new staff member */
export interface StaffCredentials {
  firstName: string
  lastName: string
  username: string
  password: string
}

interface StaffState {
  /** All staff members in the system */
  staffMembers: StaffMember[]
  /** Loading state for async operations */
  isLoading: boolean
  /** Error message if last operation failed */
  error: string | null
}

interface StaffActions {
  /** Fetch all staff members from the backend */
  fetchStaff: () => Promise<void>
  /** Add a new staff member (returns credentials) */
  addStaffMember: (firstName: string, lastName: string) => Promise<StaffCredentials>
  /** Remove a staff member */
  removeStaffMember: (staffId: StaffId) => Promise<void>
  /** Clear any error state */
  clearError: () => void
}

// =============================================================================
// Helpers
// =============================================================================

/** Transforms API staff to frontend StaffMember */
function toStaffMember(apiStaff: ApiStaff): StaffMember {
  return {
    id: toStaffId(apiStaff.staff_id),
    firstName: apiStaff.first_name,
    lastName: apiStaff.last_name,
    username: apiStaff.username,
    email: `${apiStaff.username}@frontdash.app`,
    isFirstLogin: apiStaff.is_first_login,
    createdAt: apiStaff.created_at,
  }
}

// =============================================================================
// Store
// =============================================================================

export const useStaffStore = create<StaffState & StaffActions>((set, get) => ({
  // Initial state
  staffMembers: [],
  isLoading: false,
  error: null,

  // Actions
  fetchStaff: async (): Promise<void> => {
    set({ isLoading: true, error: null })
    try {
      const apiStaff = await staffApi.getAll()
      set({
        staffMembers: apiStaff.map(toStaffMember),
        isLoading: false,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch staff'
      set({ error: message, isLoading: false })
    }
  },

  addStaffMember: async (firstName: string, lastName: string): Promise<StaffCredentials> => {
    const first = firstName.trim()
    const last = lastName.trim()

    if (!first || !last) {
      throw new Error('First and last name are required')
    }

    try {
      const result = await staffApi.create({ first_name: first, last_name: last })

      // Refresh the full list to stay in sync
      await get().fetchStaff()

      return {
        firstName: first,
        lastName: last,
        username: result.credentials.username,
        password: result.credentials.password,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add staff member'
      set({ error: message })
      throw err
    }
  },

  removeStaffMember: async (staffId: StaffId): Promise<void> => {
    try {
      await staffApi.delete(staffId)
      // Refresh the full list to stay in sync
      await get().fetchStaff()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove staff member'
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

/** Get total staff count */
export const selectStaffCount = (state: StaffState): number => state.staffMembers.length

/** Get staff members who haven't changed their password yet */
export const selectPendingPasswordChange = (state: StaffState): StaffMember[] =>
  state.staffMembers.filter((s) => s.isFirstLogin)
