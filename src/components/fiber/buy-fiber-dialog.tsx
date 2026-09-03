"use client";

import { useActionState, useEffect, useState } from "react";
import { Cable, Loader2, Plus } from "lucide-react";

import { createFiberPurchase } from "@/app/actions/fiber";
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

const BRAND_PRESETS = ["Leo", "Excel", "BDCOM", "Sujong", "SF", "Opticolor"];
const CODE_PRESETS = ["FTTH", "ADSS", "GYTA", "GYTS", "Drop Cable"];
const CORES = [2, 4, 6, 8, 12, 24];

export function BuyFiberDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createFiberPurchase,
    initialState
  );
  const [core, setCore] = useState("2");
  const [code, setCode] = useState("FTTH");
  const [length, setLength] = useState("500");

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Buy Fiber
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buy fiber drum</DialogTitle>
          <DialogDescription>
            Record a new fiber purchase — brand, core, code and length. Stock
            updates and usages are deducted automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="core" value={core} />
          <input type="hidden" name="code" value={code} />

          <div className="grid grid-cols-2 gap-4">
            <DateField name="date" label="Purchase date" />
            <div className="grid gap-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                name="brand"
                list="fiber-brands"
                placeholder="e.g. Leo"
                required
              />
              <datalist id="fiber-brands">
                {BRAND_PRESETS.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Core</Label>
            <div className="flex flex-wrap gap-2">
              {CORES.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={core === String(c) ? "default" : "outline"}
                  onClick={() => setCore(String(c))}
                >
                  {c}-core
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Code</Label>
            <div className="flex flex-wrap gap-2">
              {CODE_PRESETS.map((c) => (
                <Button
                  key={c}
                  type="button"
                  size="sm"
                  variant={code === c ? "default" : "outline"}
                  onClick={() => setCode(c)}
                >
                  {c}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="lengthM">Length (m)</Label>
              <Input
                id="lengthM"
                name="lengthM"
                inputMode="decimal"
                placeholder="500"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amount">Cost (৳)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                placeholder="6500"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="pnote">Note (optional)</Label>
            <Input id="pnote" name="note" placeholder="e.g. Drum 2 · main line" />
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            <Cable className="size-4 text-sky-500" />
            Stock is tracked per drum — usages are deducted oldest drum first
            (FIFO).
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
              Save Purchase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
