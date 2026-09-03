"use client";

import { useActionState, useEffect, useState } from "react";
import { Droplets, Loader2, Plus } from "lucide-react";

import { createOilChange } from "@/app/actions/oil";
import type { ActionState } from "@/app/actions/fuel";
import { DateField } from "@/components/date-field";
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

const initialState: ActionState = { status: "idle", message: "" };

const OIL_PRESETS = [
  "Shell Advance AX5 20W-40",
  "Mobil Super Moto 20W-40",
  "Motul 3100 Gold 20W-50",
  "Liqui Moly Street 10W-40",
  "Castrol Power1 Cruise 20W-50",
  "Repsol Moto Rider 4T 10W-30",
  "Honda 4T 10W-30",
];

export function AddOilDialog({
  vehicleId,
  defaultOpen = false,
  expectedOdometer,
}: {
  vehicleId: number;
  defaultOpen?: boolean;
  expectedOdometer?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createOilChange,
    initialState
  );
  const [odometer, setOdometer] = useState(
    expectedOdometer ? String(expectedOdometer) : ""
  );
  const [oilName, setOilName] = useState("");

  useEffect(() => {
    if (open && expectedOdometer) setOdometer(String(expectedOdometer));
  }, [open, expectedOdometer]);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setOilName("");
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Log Oil Drain
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log mobil (oil) drain</DialogTitle>
          <DialogDescription>
            Record an engine-oil change. KM since the last drain and the next
            due odometer are calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="grid grid-cols-2 gap-4">
            <DateField name="date" label="Change date" />
            <div className="grid gap-2">
              <Label htmlFor="odometer">Odometer (KM)</Label>
              <Input
                id="odometer"
                name="odometer"
                inputMode="numeric"
                placeholder="2200"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="oilName">Engine oil</Label>
            <Input
              id="oilName"
              name="oilName"
              list="oil-presets"
              placeholder="e.g. Shell Advance AX5 20W-40"
              value={oilName}
              onChange={(e) => setOilName(e.target.value)}
              required
            />
            <datalist id="oil-presets">
              {OIL_PRESETS.map((preset) => (
                <option key={preset} value={preset} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Oil quantity (L)</Label>
              <Input
                id="quantity"
                name="quantity"
                inputMode="decimal"
                placeholder="0.9"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Cost (৳)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="450"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input
              id="note"
              name="note"
              placeholder="e.g. with oil filter / servicing"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Droplets className="size-4 text-sky-500" />
            Reminder: drain every 1,200 KM for smooth engine health.
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
              Save Oil Change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
