'use client'

import * as React from 'react'
import { AppSidebar } from '../dashboard/components/app-sidebar'

export function AdminSidebar({ collapsed = false }: { collapsed?: boolean }) {
  return <AppSidebar collapsed={collapsed} />
}