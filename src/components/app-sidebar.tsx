"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Bike,
  Car,
  Droplets,
  Fuel,
  LayoutDashboard,
  Gauge,
  History,
  Wrench,
  BadgeDollarSign,
  Plus,
  TrendingUp,
  Truck,
  Users,
  UserPlus,
  Cable,
  Scissors,
  type LucideIcon,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { setActiveVehicle } from "@/app/actions/vehicles";
import type { VehicleRow } from "@/db/schema";

const data = {
  navMain: [
    {
      title: "Overview",
      url: "/",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Dashboard",
          url: "/",
        },
        {
          title: "Fleet Overview",
          url: "/fleet",
        },
        {
          title: "Mileage Charts",
          url: "/#charts",
        },
      ],
    },
    {
      title: "Fuel Log",
      url: "/fuel",
      icon: Fuel,
      items: [
        {
          title: "Refill History",
          url: "/fuel",
        },
        {
          title: "KM per Litre",
          url: "/fuel#stats",
        },
      ],
    },
    {
      title: "Mobil (Oil) Log",
      url: "/mobil",
      icon: Droplets,
      items: [
        {
          title: "Change History",
          url: "/mobil",
        },
        {
          title: "Due Status",
          url: "/mobil#status",
        },
      ],
    },
    {
      title: "Users & Owners",
      url: "/users",
      icon: Users,
      items: [
        {
          title: "All Users",
          url: "/users",
        },
        {
          title: "Assign Vehicles",
          url: "/fleet",
        },
      ],
    },
    {
      title: "Fiber Stock",
      url: "/fiber",
      icon: Cable,
      items: [
        {
          title: "Fiber Dashboard",
          url: "/fiber",
        },
        {
          title: "Purchases",
          url: "/fiber#purchases",
        },
        {
          title: "Usage Log",
          url: "/fiber#usage",
        },
        {
          title: "Clients",
          url: "/fiber#clients",
        },
      ],
    },
  ] satisfies {
    title: string;
    url: string;
    icon: LucideIcon;
    isActive?: boolean;
    items: { title: string; url: string }[];
  }[],
};

const quickActions = [
  { name: "Add Fuel Refill", url: "/fuel?new=1", icon: Plus },
  { name: "Log Oil Drain", url: "/mobil?new=1", icon: Wrench },
  { name: "Add Vehicle", url: "/fleet?new=1", icon: Truck },
  { name: "Add User", url: "/users?new=1", icon: UserPlus },
  { name: "Buy Fiber", url: "/fiber?new=1", icon: Cable },
  { name: "Log Fiber Usage", url: "/fiber?use=1", icon: Scissors },
];

const insights = [
  { name: "Total KM", url: "/#stats-distance", icon: Gauge },
  { name: "Mileage KM/L", url: "/#stats-mileage", icon: TrendingUp },
  { name: "Fuel Spending", url: "/#stats-spending", icon: BadgeDollarSign },
  { name: "Oil Changes", url: "/mobil#history", icon: History },
];

export function AppSidebar({
  vehicles,
  activeVehicleId,
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  vehicles: VehicleRow[];
  activeVehicleId: number;
  user: { name: string; email: string; role: "user" | "admin" };
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const teams = vehicles.map((vehicle) => ({
    id: vehicle.id,
    name: vehicle.name,
    logo: vehicle.category === "CAR" ? Car : Bike,
    plan: `${vehicle.category === "CAR" ? "Car" : "Bike"} · ${vehicle.fuelType}`,
  }));

  function handleSelectVehicle(id: number) {
    startTransition(async () => {
      await setActiveVehicle(id);
      router.refresh();
    });
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className={pending ? "pointer-events-none opacity-60" : undefined}>
          {teams.length > 0 ? (
            <TeamSwitcher
              teams={teams}
              activeId={activeVehicleId}
              onSelectTeam={handleSelectVehicle}
            />
          ) : null}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarMenu>
            {quickActions.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Reports</SidebarGroupLabel>
          <SidebarMenu>
            {insights.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.name}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
