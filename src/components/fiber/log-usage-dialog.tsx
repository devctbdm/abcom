"use client";

import { useActionState, useEffect, useState } from "react";
import { Loader2, Scissors, UserPlus } from "lucide-react";

import { createFiberUsage } from "@/app/actions/fiber";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState: ActionState = { status: "idle", message: "" };

export type DrumOption = {
  id: number;
  label: string;
  remaining: number;
};

export type ClientOption = {
  id: number;
  clientId: string;
  name: string;
};

export function LogUsageDialog({
  drums,
  clients,
  defaultOpen = false,
}: {
  drums: DrumOption[];
  clients: ClientOption[];
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [state, formAction, isPending] = useActionState(
    createFiberUsage,
    initialState
  );
  const [client, setClient] = useState(clients[0] ? String(clients[0].id) : "__new__");
  const [purchase, setPurchase] = useState("0");

  useEffect(() => {
    if (state.status === "success") {
      setOpen(false);
      setPurchase("0");
    }
  }, [state]);

  const isNewClient = client === "__new__";
  const totalLeft = drums.reduce((s, d) => s + d.remaining, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scissors />
          Log Usage
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log fiber usage</DialogTitle>
          <DialogDescription>
            Give fiber to a client — meters are deducted from stock and the
            oldest drum is consumed first automatically.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="grid gap-4">
          <input type="hidden" name="clientId" value={client} />
          <input type="hidden" name="purchaseId" value={purchase} />

          <div className="grid gap-2">
            <Label>Client</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pick a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.clientId} · {c.name}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">
                  <span className="inline-flex items-center gap-1">
                    <UserPlus className="size-3.5" /> New client…
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isNewClient ? (
            <div className="grid grid-cols-2 gap-4 rounded-lg border bg-muted/40 p-3">
              <div className="grid gap-2">
                <Label htmlFor="newClientId">Client ID</Label>
                <Input
                  id="newClientId"
                  name="newClientId"
                  placeholder="razzak@ptap"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="newClientName">Name</Label>
                <Input
                  id="newClientName"
                  name="newClientName"
                  placeholder="Razzak"
                />
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="newClientPhone">Phone (optional)</Label>
                <Input
                  id="newClientPhone"
                  name="newClientPhone"
                  placeholder="+880 17xx-xxxxxx"
                />
              </div>
              <p className="col-span-2 text-xs text-muted-foreground">
                Zone is auto-detected from the ID (part after @).
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="meters">Meters used</Label>
              <Input
                id="meters"
                name="meters"
                inputMode="decimal"
                placeholder="35"
                required
              />
            </div>
            <DateField name="date" label="Usage date" />
          </div>

          <div className="grid gap-2">
            <Label>From drum</Label>
            <Select value={purchase} onValueChange={setPurchase}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Auto (oldest drum first)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">
                  Auto — oldest drum first (FIFO)
                </SelectItem>
                {drums.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.label} · {d.remaining.toFixed(0)} m left
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground tabular-nums">
              Total stock left: {totalLeft.toFixed(0)} m
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="unote">Note (optional)</Label>
            <Input id="unote" name="note" placeholder="e.g. drop line, splice" />
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
              Log Usage
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
