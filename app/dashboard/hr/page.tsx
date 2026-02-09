import React from "react"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { HrPortal } from "@/components/dashboard/hr-portal"
import { getCurrentUser } from "@/lib/auth"
import { canSeeHrPortal } from "@/lib/permissions"

export default async function HrPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  if (!canSeeHrPortal(user.role)) {
    redirect("/dashboard")
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <main className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                HR Portal
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Create employee accounts and temporary passwords.
              </p>
            </div>

            <HrPortal />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}

