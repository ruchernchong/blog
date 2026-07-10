import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { auth } from "@/lib/auth";
import { StudioShell } from "./app-sidebar";
import { StudioAccessFallback } from "./studio-access-fallback";

export { StudioAccessFallback } from "./studio-access-fallback";

interface StudioAccessProps {
  children: ReactNode;
}

export function StudioAccess({ children }: StudioAccessProps) {
  return (
    <Suspense fallback={<StudioAccessFallback />}>
      <StudioAccessContent>{children}</StudioAccessContent>
    </Suspense>
  );
}

async function StudioAccessContent({ children }: StudioAccessProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return <StudioShell>{children}</StudioShell>;
}
