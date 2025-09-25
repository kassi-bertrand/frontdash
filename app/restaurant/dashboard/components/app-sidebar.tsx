'use client'

import * as React from 'react'
import Link from 'next/link'
import {
  IconAlertTriangle,
  IconClock,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconShoppingCart,
  IconToolsKitchen2,
  IconUsers,
} from '@tabler/icons-react'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavMain } from './nav-main'
import { NavSecondary } from './nav-secondary'
import { NavUser } from './nav-user'

const data = {
  user: {
    name: 'Citrus & Thyme',
    email: 'hello@citrusandthyme.com',
    avatar: '/avatars/restaurant-citrus-thyme.png',
  },
  navMain: [
    {
      title: 'Overview',
      url: '/restaurant/dashboard',
      icon: IconDashboard,
      badge: 'Live',
    },
    {
      title: 'Order queue',
      url: '/restaurant/dashboard/order-queue',
      icon: IconShoppingCart,
      badge: 'Live',
    },
    {
      title: 'Menu management',
      url: '/restaurant/dashboard#menu-management',
      icon: IconToolsKitchen2,
    },
    {
      title: 'Operating hours',
      url: '/restaurant/dashboard#operating-hours',
      icon: IconClock,
    },
    {
      title: 'Contact details',
      url: '/restaurant/dashboard#contact-info',
      icon: IconUsers,
    },
    {
      title: 'Withdraw from FrontDash',
      url: '/restaurant/dashboard#withdrawal',
      icon: IconAlertTriangle,
    },
  ],
  navSecondary: [
    {
      title: 'Support center',
      url: '/restaurant/support',
      icon: IconHelp,
    },
    {
      title: 'Search knowledge base',
      url: '/restaurant/search',
      icon: IconSearch,
    },
  ],
}

export function RestaurantSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <Link href="/restaurant/dashboard">
                <IconInnerShadowTop className="!size-5 text-emerald-500" />
                <span className="text-base font-semibold">FrontDash • Restaurant</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
