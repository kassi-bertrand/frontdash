'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useAuth, isRestaurantUser } from '@/hooks/use-auth'

export function RestaurantHeader() {
  const { user, logout } = useAuth()
  const restaurantName = isRestaurantUser(user) ? user.restaurantName : 'Restaurant'

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b bg-white/60 backdrop-blur-md transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
            Restaurant portal
          </span>
          <h1 className="text-base font-medium">{restaurantName}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            onClick={logout}
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
