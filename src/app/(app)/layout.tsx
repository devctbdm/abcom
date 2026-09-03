import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/auth/access-denied";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { getVehicles } from "@/lib/data";
import { getActiveVehicleId } from "@/lib/active-vehicle";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  // Only admins can open the app. The role is read from the database
  // on every request, so promoting an account takes effect immediately.
  if (user.role !== "admin") {
    return <AccessDenied name={user.name} email={user.email} />;
  }

  const allVehicles = await getVehicles();
  const activeVehicleId = await getActiveVehicleId(allVehicles);

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar
          vehicles={allVehicles}
          activeVehicleId={activeVehicleId}
          user={user}
        />
        <SidebarInset>
          <SiteHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
