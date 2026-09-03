"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ArrowRight, Check } from "lucide-react";

import { setActiveVehicle } from "@/app/actions/vehicles";
import { Button } from "@/components/ui/button";

export function OpenVehicleButton({
  id,
  active,
}: {
  id: number;
  active: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (active) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Check />
        Active
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setActiveVehicle(id);
          router.push("/");
          router.refresh();
        });
      }}
    >
      Open
      <ArrowRight />
    </Button>
  );
}
