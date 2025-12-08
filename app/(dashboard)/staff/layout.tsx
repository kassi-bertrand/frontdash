'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SidebarProvider, Sidebar, SidebarInset } from '@/components/ui/sidebar'
import { StaffSidebar } from './components/staff-sidebar'
import { StaffSiteHeader } from './components/site-header'
import { Toaster } from 'sonner'
import { useAuth, isStaffUser } from '@/hooks/use-auth'

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading } = useAuth()

  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const v = typeof window !== 'undefined' ? localStorage.getItem('fd_sidebar_collapsed') : null
    setCollapsed(v === '1')
  }, [])

  useEffect(() => {
    // Wait for auth to load
    if (isLoading) return

    // Enforce first-login password change for staff
    if (isStaffUser(user) && user.mustChangePassword) {
      const onSettings = pathname?.startsWith('/staff/settings')
      if (!onSettings) {
        router.replace('/staff/settings')
      }
    }
  }, [user, isLoading, pathname, router])

  function toggleSidebar() {
    setCollapsed((c) => {
      const next = !c
      if (typeof window !== 'undefined') localStorage.setItem('fd_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  // Show nothing while loading auth state
  if (isLoading) return null

  return (
    <SidebarProvider>
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
    </SidebarProvider>
  )
}