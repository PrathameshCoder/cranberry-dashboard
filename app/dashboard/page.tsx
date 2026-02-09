import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

// 👉 this is the feed component your AI already created
import { DashboardFeed } from "@/components/dashboard/dashboard-feed"

export default function Page() {
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
            {/* Page title */}
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Knowledge Feed
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Latest knowledge shared across the organization
              </p>
            </div>

            {/* Knowledge feed */}
            <DashboardFeed />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
