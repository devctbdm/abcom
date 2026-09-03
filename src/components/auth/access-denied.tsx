import { LogOut, ShieldAlert } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * Shown when someone signs in with an account whose role is not "admin".
 * The role is read from the database on every request, so promoting the
 * account takes effect on the next page load — no re-login needed.
 */
export function AccessDenied({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center gap-3">
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-500">
            <ShieldAlert className="size-8" />
          </div>
          <CardTitle className="text-xl">Admin access required</CardTitle>
          <CardDescription>
            You are signed in as <b>{name}</b> ({email}), but FuelRide is only
            accessible to <b>admin</b> accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="rounded-lg border bg-background p-3 text-left">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              To grant access, run this in the database:
            </p>
            <code className="block break-all font-mono text-xs text-foreground">
              UPDATE users SET role = &apos;admin&apos; WHERE email =
              &apos;{email}&apos;;
            </code>
          </div>
          <form action={logoutAction}>
            <Button type="submit" variant="outline" className="w-full">
              <LogOut />
              Log out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
