'use client'

import * as React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { IconLayoutSidebarLeftCollapse, IconLayoutSidebarRightExpand } from '@tabler/icons-react'

function getTitle(pathname: string): string {
  const path = pathname.replace(/\/+$/, '') || '/staff'
  if (path === '/staff') return 'Staff Dashboard'
  if (path.startsWith('/staff/orders')) return 'Orders'
  if (path.startsWith('/staff/settings')) return 'Settings'
  return 'Staff'
}

export function StaffSiteHeader({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const title = getTitle(pathname)
  const [username, setUsername] = React.useState('staff')

  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('fd_username') : null
    setUsername(stored && stored.trim() ? stored : 'staff')
  }, [])

  async function handleLogout() {
    try {
      localStorage.removeItem('fd_auth')
      localStorage.removeItem('fd_user')
      sessionStorage.clear()
      await fetch('/api/logout', { method: 'POST' }).catch(() => {})
    } finally {
      router.replace('/login') // redirect to login (not /)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={onToggleSidebar}
          >
            {collapsed ? (
              <IconLayoutSidebarRightExpand className="h-5 w-5" />
            ) : (
              <IconLayoutSidebarLeftCollapse className="h-5 w-5" />
            )}
          </Button>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Logged in: {username}</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">Logout</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>You will be signed out of your staff session.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button type="button" size="sm" variant="destructive" onClick={handleLogout}>
                    Logout
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  )
}