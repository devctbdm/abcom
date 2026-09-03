import Link from "next/link";
import { CircleX } from "lucide-react";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = sp.token?.trim() ?? "";

  if (token.length < 16) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <CircleX className="size-5 text-destructive" />
            Invalid reset link
          </CardTitle>
          <CardDescription>
            This password reset link is missing its token. Please request a new
            reset email.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request new link</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <ResetPasswordForm token={token} />;
}
