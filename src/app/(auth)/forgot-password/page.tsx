import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <>
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
