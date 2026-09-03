import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Fuel } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Fuel className="size-4" />
          </div>
          FuelRide
        </div>
        {children}
      </div>
    </div>
  );
}
