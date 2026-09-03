import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export const dynamic = "force-dynamic";

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
