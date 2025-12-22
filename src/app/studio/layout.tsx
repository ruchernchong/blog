import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/app/studio/providers";
import { UserMenu } from "@/components/auth/user-menu";
import { AppSidebar } from "@/components/studio/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: "Content Studio | Manage Blog Posts",
  description: "Create and manage your blog posts with a built-in CMS",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StudioLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
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
