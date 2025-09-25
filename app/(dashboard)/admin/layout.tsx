'use client'

import * as React from 'react'
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { AdminStoreProvider } from './_state/admin-store'
import { AdminSidebar } from './components/admin-sidebar'
import { AdminSiteHeader } from './components/site-header'
import { Toaster } from 'sonner'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)

  React.useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('fd_sidebar_collapsed') : null
    setCollapsed(v === '1')
  }, [])

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c
      if (typeof window !== 'undefined') localStorage.setItem('fd_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  return (
    <SidebarProvider>
      <AdminStoreProvider>
        <Sidebar
          variant="inset"
          className={
            (collapsed ? 'w-16 min-w-[4rem]' : 'w-64 min-w-[16rem]') +
            ' overflow-hidden transition-[width] duration-200'
          }
        >
          <AdminSidebar collapsed={collapsed} />
        </Sidebar>
        <SidebarInset>
          <AdminSiteHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <Toaster richColors position="top-right" />
        </SidebarInset>
      </AdminStoreProvider>
    </SidebarProvider>
  )
}