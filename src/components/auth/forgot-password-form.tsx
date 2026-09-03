"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, MailCheck } from "lucide-react";

import {
  requestPasswordResetAction,
  type PasswordResetState,
} from "@/app/actions/password-reset";
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

const initialState: PasswordResetState = { status: "idle", message: "" };

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    requestPasswordResetAction,
    initialState
  );

  if (state.status === "success") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MailCheck className="size-5 text-emerald-500" />
            Check your inbox
          </CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Open the email and click <b>“Reset password”</b> — the link is
            valid for 1 hour and can be used only once.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/login">
              <ArrowLeft />
              Back to sign in
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Forgot password?</CardTitle>
        <CardDescription>
          Enter the email you registered with and we&apos;ll send you a reset
          link.
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

          {state.status === "error" ? (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin" /> : null}
            Send reset link
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
