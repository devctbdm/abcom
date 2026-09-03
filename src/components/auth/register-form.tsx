"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";

import { registerAction, type AuthState } from "@/app/actions/auth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthState = { status: "idle", message: "" };

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Create account</CardTitle>
        <CardDescription>
          Register to start managing the fleet, staff and fiber stock.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* No role field by design — every new account is created as
            "user". Promote to "admin" directly in the database. */}
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Md Minarul Islam"
              autoComplete="name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              name="confirm"
              type="password"
              placeholder="Repeat password"
              autoComplete="new-password"
              required
            />
          </div>

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
