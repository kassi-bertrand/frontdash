import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default function RestaurantDashboardPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6">
        <div className="space-y-3 text-center">
          <Badge className="mx-auto w-fit rounded-full border border-rose-200 bg-rose-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-600">
            Restaurant portal (preview)
          </Badge>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Restaurant dashboard coming soon
          </h1>
          <p className="text-sm text-neutral-600">
            We’ll surface live orders, menu management, and operating hours once the
            backend integration is ready. For now, you can return to the homepage or
            adjust your registration details.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Back to homepage</Link>
          </Button>
          <Button asChild>
            <Link href="/register-restaurant">Submit another registration</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
