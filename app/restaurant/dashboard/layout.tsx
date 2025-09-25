import type { CSSProperties, ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { RestaurantSidebar } from './components/app-sidebar'
import { RestaurantHeader } from './components/site-header'

export default function RestaurantDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      defaultOpen
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 68)',
        } as CSSProperties
      }
    >
      <RestaurantSidebar variant="inset" />
      <SidebarInset>
        <RestaurantHeader />
        <div className="flex flex-1 flex-col bg-gradient-to-br from-emerald-50 via-white to-sky-50">
          <div className="flex-1 px-4 pb-6 pt-4 lg:px-8 lg:pb-10 lg:pt-6">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
