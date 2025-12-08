'use client'

import { useAuth, isRestaurantUser } from '@/hooks/use-auth'

import { ContactDetailsCard } from './components/contact-details-card'
import { MenuManagementPanel } from './components/menu-management-panel'
import { OperatingHoursPanel } from './components/operating-hours-panel'
import { OrdersTable } from './components/orders-table'
import { WithdrawRequestCard } from './components/withdraw-request-card'
import { restaurantOrders } from './mock-data'

export default function RestaurantDashboardPage() {
  const { user } = useAuth()
  const restaurantName = isRestaurantUser(user) ? user.restaurantName : 'Your Restaurant'
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-200 via-emerald-100 to-sky-100 p-8 text-neutral-900 shadow-lg">
        <div className="relative z-10 space-y-4">
          <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
            Today&apos;s shift
          </span>
          <h1 className="text-3xl font-semibold lg:text-4xl">
            Welcome back, {restaurantName} crew
          </h1>
          <p className="max-w-xl text-sm text-neutral-700 lg:text-base">
            This dashboard keeps you aligned with everything FrontDash expects from
            partner restaurants—live order tracking, menu upkeep, opening hours, and
            account security.
          </p>
        </div>
      </section>

      <OrdersTable orders={restaurantOrders} variant="preview" />

      <div id="requirements" className="sr-only" aria-hidden />
      <div id="delivery-checklist" className="sr-only" aria-hidden />

      <MenuManagementPanel />
      <OperatingHoursPanel />
      <ContactDetailsCard />
      <WithdrawRequestCard />
    </div>
  )
}
