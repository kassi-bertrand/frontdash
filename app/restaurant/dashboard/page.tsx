import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { ContactDetailsCard } from './components/contact-details-card'
import { MenuManagementPanel } from './components/menu-management-panel'
import { OperatingHoursPanel } from './components/operating-hours-panel'
import { OrdersTable } from './components/orders-table'
import { WithdrawRequestCard } from './components/withdraw-request-card'
import { restaurantInsights, restaurantOrders } from './mock-data'

export default function RestaurantDashboardPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-200 via-emerald-100 to-sky-100 p-8 text-neutral-900 shadow-lg">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 rounded-l-3xl bg-white/25 backdrop-blur-lg lg:block" />
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Today&apos;s shift
            </span>
            <h1 className="text-3xl font-semibold lg:text-4xl">
              Welcome back, Citrus &amp; Thyme crew
            </h1>
            <p className="max-w-xl text-sm text-neutral-700 lg:text-base">
              This dashboard keeps you aligned with everything FrontDash expects from
              partner restaurants—live order tracking, menu upkeep, opening hours, and
              account security.
            </p>
          </div>
          <Card className="border-none bg-white/80 shadow-xl shadow-emerald-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-emerald-600 uppercase tracking-[0.3em]">
                Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              {restaurantInsights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-emerald-100 bg-white/70 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    {item.label}
                  </p>
                  <p className="text-2xl font-semibold text-neutral-900">{item.value}</p>
                  <p className="text-xs text-neutral-500">{item.helper}</p>
                </div>
              ))}
            </CardContent>
          </Card>
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
