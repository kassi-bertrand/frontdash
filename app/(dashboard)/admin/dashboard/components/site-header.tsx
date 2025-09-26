'use client'

/**
 * SiteHeader — dynamic title + conditional Logout (with confirm popup)
 */

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

function getTitle(pathname: string): { title: string; showLogout: boolean } {
  const path = pathname.replace(/\/+$/, '') || '/admin'
  if (path === '/admin' || path.startsWith('/admin/dashboard')) return { title: 'Dashboard', showLogout: true }
  if (path.startsWith('/admin/restaurants')) return { title: 'Restaurants', showLogout: false }
  if (path.startsWith('/admin/staff')) return { title: 'Staff', showLogout: false }
  if (path.startsWith('/admin/drivers')) return { title: 'Drivers', showLogout: false }
  if (path.startsWith('/admin/settings')) return { title: 'Settings', showLogout: false }
  if (path.startsWith('/admin/registrations')) return { title: 'Registrations', showLogout: false }
  return { title: 'Admin', showLogout: false }
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { title, showLogout } = getTitle(pathname)

  async function handleLogout() {
    try {
      // Optional: clear any client storage you use
      localStorage.removeItem('fd_auth')
      localStorage.removeItem('fd_user')
      sessionStorage.clear()

      await fetch('/api/logout', { method: 'POST' })
    } catch {
      // ignore
    } finally {
      router.replace('/login')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">
          {showLogout ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline">Logout</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Log out?</AlertDialogTitle>
                  <AlertDialogDescription>You will be signed out of the admin dashboard.</AlertDialogDescription>
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
          ) : null}
        </div>
      </div>
    </header>
  )
}