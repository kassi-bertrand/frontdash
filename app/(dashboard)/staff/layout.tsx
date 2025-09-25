'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { AdminStoreProvider } from '../admin/_state/admin-store'
import { StaffSidebar } from './components/staff-sidebar'
import { StaffSiteHeader } from './components/site-header'
import { Toaster } from 'sonner'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  const [collapsed, setCollapsed] = React.useState(false)
  const [ready, setReady] = React.useState(false)

  React.useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('fd_sidebar_collapsed') : null
    setCollapsed(v === '1')
  }, [])

  React.useEffect(() => {
    const flag = typeof window !== 'undefined' ? localStorage.getItem('fd_must_change_pwd') : null
    const mustChange = flag === '1'
    const onSettings = pathname?.startsWith('/staff/settings')
    if (mustChange && !onSettings) {
      router.replace('/staff/settings')
      setReady(true)
      return
    }
    setReady(true)
  }, [pathname, router])

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c
      if (typeof window !== 'undefined') localStorage.setItem('fd_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  if (!ready) return null

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
          <StaffSidebar collapsed={collapsed} />
        </Sidebar>
        <SidebarInset>
          <StaffSiteHeader collapsed={collapsed} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 p-4 md:p-6">
            <div className="mx-auto w-full max-w-6xl">{children}</div>
          </main>
          <Toaster richColors position="top-right" />
        </SidebarInset>
      </AdminStoreProvider>
    </SidebarProvider>
  )
}