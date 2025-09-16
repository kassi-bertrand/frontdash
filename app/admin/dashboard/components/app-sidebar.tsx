"use client"

import * as React from "react"
import {
  IconChartBar,
  IconClock,
  IconDashboard,
  IconHelp,
  IconInnerShadowTop,
  IconMotorbike,
  IconSearch,
  IconSettings,
  IconShoppingCart,
  IconToolsKitchen2,
  IconUsers,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"

const data = {
  user: {
    name: "FrontDash Admin",
    email: "admin@frontdash.com",
    avatar: "/avatars/admin.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Restaurant Management",
      url: "/admin/restaurants",
      icon: IconToolsKitchen2,
    },
    {
      title: "Staff Management",
      url: "/admin/staff",
      icon: IconUsers,
    },
    {
      title: "Driver Management",
      url: "/admin/drivers",
      icon: IconMotorbike,
    },
    {
      title: "Order Oversight",
      url: "/admin/orders",
      icon: IconShoppingCart,
    },
  ],
  navClouds: [
    {
      title: "Restaurant Queue",
      icon: IconToolsKitchen2,
      isActive: true,
      url: "/admin/restaurants",
      items: [
        {
          title: "Pending Applications",
          url: "/admin/restaurants/pending",
        },
        {
          title: "Active Restaurants",
          url: "/admin/restaurants/active",
        },
        {
          title: "Withdrawal Requests",
          url: "/admin/restaurants/withdrawals",
        },
      ],
    },
    {
      title: "System Analytics",
      icon: IconChartBar,
      url: "/admin/analytics",
      items: [
        {
          title: "Platform Metrics",
          url: "/admin/analytics/platform",
        },
        {
          title: "Revenue Reports",
          url: "/admin/analytics/revenue",
        },
        {
          title: "Performance Data",
          url: "/admin/analytics/performance",
        },
      ],
    },
    {
      title: "Real-time Monitoring",
      icon: IconClock,
      url: "/admin/monitoring",
      items: [
        {
          title: "Live Orders",
          url: "/admin/monitoring/orders",
        },
        {
          title: "Driver Status",
          url: "/admin/monitoring/drivers",
        },
        {
          title: "System Health",
          url: "/admin/monitoring/system",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/admin/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/admin/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Restaurant Applications",
      url: "/admin/restaurants/pending",
      icon: IconToolsKitchen2,
    },
    {
      name: "System Reports",
      url: "/admin/analytics/reports",
      icon: IconChartBar,
    },
    {
      name: "Order Analytics",
      url: "/admin/analytics/orders",
      icon: IconShoppingCart,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/admin/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">FrontDash</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
