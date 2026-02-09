import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import SearchClient from "@/app/dashboard/search/search-client";

export default async function SearchPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="mx-auto w-full max-w-6xl px-4 py-6">
          <SearchClient />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
