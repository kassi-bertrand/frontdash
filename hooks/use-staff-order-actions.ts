/**
 * useStaffOrderActions Hook
 * =============================================================================
 * Encapsulates staff order workflow actions: retrieve, assign driver, deliver.
 * Handles auth checks, password change enforcement, and toast notifications.
 * =============================================================================
 */

import { useState } from 'react'
import { toast } from 'sonner'
import { useAdminStore } from '@/app/(dashboard)/admin/_state/admin-store'
import { useAuth, isStaffUser } from '@/hooks/use-auth'
import { parseTimeToISO } from '@/lib/utils'

export function useStaffOrderActions() {
  const { state, actions } = useAdminStore()
  const { user } = useAuth()

  // Staff must change password before taking actions
  const mustChangePwd = isStaffUser(user) && user.mustChangePassword
  const canAct = isStaffUser(user) && !mustChangePwd

  // Form state for driver assignment and delivery time
  const [assigning, setAssigning] = useState<Record<string, string>>({})
  const [deliveredHHMM, setDeliveredHHMM] = useState<Record<string, string>>({})

  // Retrieve the first order from the queue
  async function retrieveFirst() {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings first.')
      return null
    }
    try {
      const res = await actions.staffRetrieveFirstOrder()
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

  // Retrieve a specific order by ID
  async function retrieveById(orderId: string) {
    if (mustChangePwd) {
      toast.warning('Please change your password in Settings first.')
      return null
    }
    try {
      const res = await actions.staffRetrieveOrderById(orderId)
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

  // Assign a driver to an order
  async function assignDriver(orderId: string, preselectedDriverId?: string) {
    if (!canAct) {
      toast.warning('Please change your password in Settings first.')
      return false
    }
    if (!isStaffUser(user)) {
      toast.error('Staff authentication required.')
      return false
    }

    const driverId = preselectedDriverId || assigning[orderId]
    if (!driverId) {
      toast.error('Select a driver first.')
      return false
    }

    try {
      await actions.staffAssignDriver(orderId, driverId, user.staffId)
      toast.success('Driver assigned.')
      setAssigning((m) => ({ ...m, [orderId]: '' }))
      return true
    } catch {
      toast.error('Failed to assign driver.')
      return false
    }
  }

  // Mark an order as delivered
  async function markDelivered(orderId: string, driverId?: string) {
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
      await actions.staffMarkDelivered(orderId, iso)
      toast.success('Delivery recorded.')
      setDeliveredHHMM((m) => ({ ...m, [orderId]: '' }))
      return true
    } catch {
      toast.error('Failed to record delivery.')
      return false
    }
  }

  return {
    // State
    state,
    drivers: state.drivers,
    orders: state.orders,
    assignedOrders: state.assignedOrders,
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
