import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { type ReactNode, Suspense } from "react";
import { Providers } from "@/app/studio/providers";
import { UserMenu } from "@/components/auth/user-menu";
import { AppSidebar } from "@/components/studio/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Content Studio | Manage Blog Posts",
  description: "Create and manage your blog posts with a built-in CMS",
  robots: {
    index: false,
    follow: false,
  },
};

async function AuthCheck({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return (
    <Providers>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 items-center justify-between border-b px-4">
            <SidebarTrigger />
            <UserMenu />
          </header>
          <main className="p-4">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </Providers>
  );
}

export default function StudioLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCheck>{children}</AuthCheck>
    </Suspense>
  );
}
