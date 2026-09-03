"use client";

import { useActionState, useEffect, useState } from "react";
import { Wrench, Loader2, Plus } from "lucide-react";

import { createMaintenance, type ActionState } from "@/app/actions/maintenance";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionState = { status: "idle", message: "" };

export function AddMaintenanceDialog({
  vehicleId,
  defaultOpen = false,
}: {
  vehicleId: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createMaintenance,
    initialState,
  );
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setDescription("");
      setAmount("");
    }
  }, [state, setOpen]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Maintenance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add maintenance record</DialogTitle>
          <DialogDescription>
            Record parts purchase or service bill with date, time, and cost
            details.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <div className="grid gap-2">
            <Label htmlFor="type">Type</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PARTS">Parts</SelectItem>
                <SelectItem value="SERVICE">Service</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <DateField name="date" label="Date" />
            <div className="grid gap-2">
              <Label htmlFor="time">Time (optional)</Label>
              <Input id="time" name="time" type="time" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="e.g. Brake pads replacement, Oil change"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
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
              <Label htmlFor="shopName">Shop (optional)</Label>
              <Input
                id="shopName"
                name="shopName"
                placeholder="e.g. Honda Service Center"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" placeholder="e.g. Warranty covered" />
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Wrench className="size-4 text-blue-500" />
            <span>Track all bike maintenance costs and history</span>
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
              Save Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
