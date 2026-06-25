import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/logo";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to access the content management system",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <Link
          href="/"
          aria-label="Ru Chern, home"
          className="flex items-center gap-2 self-center"
        >
          <Logo />
          <span className="font-mono text-foreground text-sm">ru-chern</span>
        </Link>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
