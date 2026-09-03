"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";

import { loginAction, type AuthState } from "@/app/actions/auth";
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

export function LoginForm({ passwordReset = false }: { passwordReset?: boolean }) {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Sign in</CardTitle>
        <CardDescription>
          Enter your email and password to access the dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="admin@fuelride.bd"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {passwordReset ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
              <CheckCircle2 className="size-4 !text-emerald-600" />
              <AlertDescription className="text-emerald-800">
                Password updated — sign in with your new password.
              </AlertDescription>
            </Alert>
          ) : null}

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
