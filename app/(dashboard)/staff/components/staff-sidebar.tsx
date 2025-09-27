'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { IconLayoutDashboard, IconSettings, IconClipboardList } from '@tabler/icons-react'

export function StaffSidebar({ collapsed = false }: { collapsed?: boolean }) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/staff') return pathname === '/staff'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const Item = ({
    href,
    label,
    Icon,
  }: {
    href: string
    label: string
    Icon: React.ComponentType<{ className?: string }>
  }) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        className={`flex items-center ${collapsed ? 'justify-center' : 'justify-start'} gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted ${
          active ? 'bg-muted font-medium' : ''
        }`}
        title={collapsed ? label : undefined}
        aria-label={collapsed ? label : undefined}
      >
        <Icon className={collapsed ? 'h-6 w-6' : 'h-4 w-4'} />
        {!collapsed && <span>{label}</span>}
      </Link>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="border-b px-4 py-4">
        <Link
          href="/staff"
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

      <div className="flex-1 p-2">
        <ul className="space-y-1">
          <li>
            <Item href="/staff" label="Dashboard" Icon={IconLayoutDashboard} />
          </li>
          <li>
            <Item href="/staff/orders" label="Orders" Icon={IconClipboardList} />
          </li>
          <li>
            <Item href="/staff/settings" label="Settings" Icon={IconSettings} />
          </li>
        </ul>
      </div>
    </div>
  )
}