"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

import { assignVehicleOwner } from "@/app/actions/staff";
import type { StaffRow } from "@/db/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function OwnerSelect({
  vehicleId,
  ownerId,
  people,
}: {
  vehicleId: number;
  ownerId: number | null;
  people: StaffRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Select
      value={String(ownerId ?? 0)}
      disabled={pending}
      onValueChange={(value) => {
        startTransition(async () => {
          await assignVehicleOwner(vehicleId, Number(value));
          router.refresh();
        });
      }}
    >
      <SelectTrigger size="sm" className="w-44">
        <SelectValue placeholder="Unassigned" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="0">Unassigned</SelectItem>
        {people.map((person) => (
          <SelectItem key={person.id} value={String(person.id)}>
            {person.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
