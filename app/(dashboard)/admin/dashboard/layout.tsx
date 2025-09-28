'use client'

/**
 * Admin dashboard page layout (now minimal):
 * - DO NOT wrap with SidebarProvider here anymore (already provided at app/(dashboard)/admin/layout.tsx).
 * - Keep this file only if you need page-specific wrappers for the dashboard page.
 */

import * as React from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}