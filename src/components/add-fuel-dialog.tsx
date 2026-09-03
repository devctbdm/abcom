"use client";

import { useActionState, useEffect, useState } from "react";
import { Fuel, Loader2, Plus } from "lucide-react";

import { createFuelLog, type ActionState } from "@/app/actions/fuel";
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

const PRESETS = [300, 500, 1000, 1500];

export function AddFuelDialog({
  vehicleId,
  defaultOpen = false,
  lastPricePerLiter = 141,
  expectedOdometer,
}: {
  vehicleId: number;
  defaultOpen?: boolean;
  lastPricePerLiter?: number;
  expectedOdometer?: number;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createFuelLog,
    initialState
  );
  const [amount, setAmount] = useState("");
  const [liters, setLiters] = useState("");
  const [odometer, setOdometer] = useState(
    expectedOdometer ? String(expectedOdometer) : ""
  );

  useEffect(() => {
    if (open && expectedOdometer) setOdometer(String(expectedOdometer));
  }, [open, expectedOdometer]);

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setAmount("");
      setLiters("");
    }
  }, [state]);

  const amt = Number(amount);
  const ltr = Number(liters);
  const hasPair = amt > 0 && ltr > 0;

  function preset(taka: number) {
    setAmount(String(taka));
    if (lastPricePerLiter > 0) {
      setLiters((taka / lastPricePerLiter).toFixed(3));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Refill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add fuel refill</DialogTitle>
          <DialogDescription>
            Enter the money paid, the litres from the pump and the bike odometer
            reading. KM per litre and days run are computed automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((taka) => (
              <Button
                key={taka}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => preset(taka)}
              >
                ৳{taka.toLocaleString("en-US")}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount (৳)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="liters">Litres (L)</Label>
              <Input
                id="liters"
                name="liters"
                inputMode="decimal"
                placeholder="3.53"
                value={liters}
                onChange={(e) => setLiters(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField name="date" label="Refill date" />
            <div className="grid gap-2">
              <Label htmlFor="odometer">Odometer (KM)</Label>
              <Input
                id="odometer"
                name="odometer"
                inputMode="numeric"
                placeholder="1000"
                value={odometer}
                onChange={(e) => setOdometer(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" placeholder="e.g. full tank, long ride" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Fuel className="size-4 text-orange-500" />
            {hasPair ? (
              <span className="tabular-nums">
                Petrol price: ৳{(amt / ltr).toFixed(1)} per litre
              </span>
            ) : (
              <span>
                Last petrol price reference: ৳{lastPricePerLiter.toFixed(1)} per
                litre
              </span>
            )}
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
              Save Refill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
