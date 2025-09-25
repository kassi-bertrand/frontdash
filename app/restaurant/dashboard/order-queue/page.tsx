import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { OrdersTable } from '../components/orders-table'
import { restaurantInsights, restaurantOrders } from '../mock-data'

export default function RestaurantOrderQueuePage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-4 pb-16 pt-6 lg:px-8">
      <section className="rounded-3xl border border-emerald-100 bg-white/90 p-8 shadow-lg shadow-emerald-100/40">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-start">
          <div className="space-y-3">
            <CardTitle className="text-3xl font-semibold text-neutral-900">
              Live order queue
            </CardTitle>
            <p className="text-sm text-neutral-600 lg:text-base">
              Drag rows to reprioritize tickets as they come in. Pagination keeps the full
              queue manageable once the kitchen is slammed.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {restaurantInsights.map((item) => (
              <Card
                key={item.label}
                className="border border-emerald-100 bg-white/70 py-4 text-center shadow-none"
              >
                <CardHeader className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    {item.label}
                  </p>
                  <CardTitle className="text-2xl font-semibold text-neutral-900">
                    {item.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-neutral-500">
                  {item.helper}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <OrdersTable orders={restaurantOrders} variant="full" fullPageSize={8} />
    </div>
  )
}
