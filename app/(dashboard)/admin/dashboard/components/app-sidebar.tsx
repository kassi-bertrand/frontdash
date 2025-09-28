'use client'

/**
 * Admin Sidebar (icons-only when collapsed; full labels when expanded)
 * - Collapsed: fixed rail (w-16). Icons larger (h-6 w-6) with tooltips via title/aria-label.
 * - Expanded: full width (w-64). Brand + labels visible; icons default size.
 * - Sidebar logout remains hidden on /admin/dashboard, shown elsewhere.
 */

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconBuildingStore,
  IconUsersGroup,
  IconTruckDelivery,
  IconSettings,
} from '@tabler/icons-react'
import * as React from 'react'
import { LogoutButton } from '@/components/logout-button'

type SidebarProps = {
  name?: string
  email?: string
  variant?: string
  collapsed?: boolean
}

export function AppSidebar({
  name = 'Admin User',
  email = 'admin@example.com',
  variant: _variant,
  collapsed = false,
}: SidebarProps) {
  const pathname = usePathname()

  const items = React.useMemo(
    () => [
      { href: '/admin/dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { href: '/admin/restaurants', label: 'Restaurants', icon: IconBuildingStore },
      { href: '/admin/staff', label: 'Staff', icon: IconUsersGroup },
      { href: '/admin/drivers', label: 'Drivers', icon: IconTruckDelivery },
      { href: '/admin/settings', label: 'Settings', icon: IconSettings },
    ],
    []
  )

  const isOnDashboard = pathname === '/admin/dashboard'

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b px-4 py-4">
        <Link
          href="/admin/dashboard"
          className={`flex items-center gap-2 ${collapsed ? 'justify-center' : 'justify-start'}`}
          title={collapsed ? 'FrontDash' : undefined}
          aria-label="FrontDash"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 font-bold text-primary">
            FD
          </div>
          {!collapsed && <div className="text-lg font-semibold">FrontDash</div>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/admin/dashboard' && pathname.startsWith(href))

            return (
              <li key={href}>
                <Link
                  href={href}
                  data-active={active ? 'true' : 'false'}
                  className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-3 rounded-md px-3 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground data-[active=true]:bg-muted data-[active=true]:text-foreground`}
                  title={collapsed ? label : undefined}
                  aria-label={collapsed ? label : undefined}
                >
                  <Icon className={collapsed ? 'h-6 w-6' : 'h-5 w-5'} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info + conditional Logout */}
      <div className="mt-auto space-y-2 border-t px-4 py-3 text-sm">
        {!collapsed && (
          <div>
            <div className="font-medium">{name}</div>
            <div className="text-muted-foreground">{email}</div>
          </div>
        )}
        {!isOnDashboard && <LogoutButton redirectTo="/login" className="w-full" />}
      </div>
    </div>
  )
}