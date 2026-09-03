"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Plus, UserPlus } from "lucide-react";

import { createStaff } from "@/app/actions/staff";
import type { ActionState } from "@/app/actions/fuel";
import type { VehicleRow } from "@/db/schema";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionState = { status: "idle", message: "" };

const POSITIONS = [
  "Manager",
  "Senior Technician",
  "Technician",
  "Delivery Rider",
  "Executive",
  "Supervisor",
  "Driver",
];

export function AddStaffDialog({
  vehicles,
  defaultOpen = false,
}: {
  vehicles: VehicleRow[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createStaff,
    initialState
  );
  const [vehicleId, setVehicleId] = useState("0");

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setVehicleId("0");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add user / bike owner</DialogTitle>
          <DialogDescription>
            Register an employee and assign the bike or car they ride. Fuel and
            mobil costs then roll up per person.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />

          <div className="grid gap-2">
            <Label htmlFor="sname">Full name</Label>
            <Input
              id="sname"
              name="name"
              placeholder="e.g. Md Minarul Islam"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              name="position"
              list="position-presets"
              placeholder="e.g. Manager"
              required
            />
            <datalist id="position-presets">
              {POSITIONS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-2">
            <Label>Assign vehicle (optional)</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="No vehicle assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No vehicle assigned</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={String(vehicle.id)}>
                    {vehicle.name} · {vehicle.regNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="+880 1711-100200"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="snote">Note (optional)</Label>
              <Input id="snote" name="note" placeholder="e.g. Head office" />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <UserPlus className="size-4 text-violet-500" />
            One person can own several vehicles — assign more from the fleet
            table.
          </div>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="animate-spin" /> : null}
              Save User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
