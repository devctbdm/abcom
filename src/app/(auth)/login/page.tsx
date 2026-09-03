import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const sp = await searchParams;

  return (
    <>
      <LoginForm passwordReset={sp.reset === "1"} />
      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Register
        </Link>
      </p>
    </>
  );
}
