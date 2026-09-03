"use client";

import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/fuel": "Fuel Log",
  "/mobil": "Mobil (Oil) Log",
  "/fleet": "Fleet Management",
  "/users": "Users & Owners",
  "/fiber": "Fiber Management",
};

export function SiteHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "Dashboard";

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/">FuelRide</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>{title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <Badge variant="outline" className="hidden sm:inline-flex">
          <CalendarDays />
          <span suppressHydrationWarning>{today}</span>
        </Badge>
        <Badge>Petrol · BDT</Badge>
      </div>
    </header>
  );
}
