"use client";

import { useActionState, useEffect, useState } from "react";
import { Bike, Car, Loader2, Plus } from "lucide-react";

import { createVehicle } from "@/app/actions/vehicles";
import type { ActionState as SharedState } from "@/app/actions/fuel";
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

const initialState: SharedState = { status: "idle", message: "" };

const CATEGORY_META = {
  BIKE: { label: "Bike", interval: "1200", icon: Bike },
  CAR: { label: "Car", interval: "8000", icon: Car },
} as const;

const FUEL_TYPES = ["Petrol", "Octane", "Diesel", "CNG"] as const;

export function AddVehicleDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createVehicle as (prev: SharedState, data: FormData) => Promise<SharedState>,
    initialState
  );
  const [category, setCategory] = useState<"BIKE" | "CAR">("BIKE");
  const [fuelType, setFuelType] = useState<string>("Petrol");
  const [interval, setIntervalKm] = useState("1200");

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state]);

  function pickCategory(next: "BIKE" | "CAR") {
    setCategory(next);
    setIntervalKm(CATEGORY_META[next].interval);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Add Vehicle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a vehicle</DialogTitle>
          <DialogDescription>
            Register a company bike or car. Its fuel and mobil records will be
            tracked separately, with per-vehicle mileage and oil-due alerts.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="category" value={category} />
          <input type="hidden" name="fuelType" value={fuelType} />

          <div className="grid gap-2">
            <Label>Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CATEGORY_META) as ("BIKE" | "CAR")[]).map((key) => {
                const Meta = CATEGORY_META[key];
                return (
                  <Button
                    key={key}
                    type="button"
                    variant={category === key ? "default" : "outline"}
                    onClick={() => pickCategory(key)}
                  >
                    <Meta.icon />
                    {Meta.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="vname">Vehicle name</Label>
            <Input
              id="vname"
              name="name"
              placeholder={category === "CAR" ? "e.g. BMW 320i" : "e.g. Yamaha R15 V4"}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="regNo">Registration number</Label>
            <Input
              id="regNo"
              name="regNo"
              placeholder="e.g. DHAKA METRO · KA 51-8899"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Fuel type</Label>
            <div className="flex flex-wrap gap-2">
              {FUEL_TYPES.map((type) => (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={fuelType === type ? "default" : "outline"}
                  onClick={() => setFuelType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="oilIntervalKm">Oil change every (KM)</Label>
              <Input
                id="oilIntervalKm"
                name="oilIntervalKm"
                inputMode="numeric"
                value={interval}
                onChange={(e) => setIntervalKm(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vnote">Note (optional)</Label>
              <Input id="vnote" name="note" placeholder="e.g. delivery bike" />
            </div>
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
              Save Vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
