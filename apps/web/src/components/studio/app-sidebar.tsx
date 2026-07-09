"use client";

import { Sidebar } from "@heroui-pro/react";
import {
  BookOpen01Icon,
  File01Icon,
  Image01Icon,
  Layers01Icon,
  SquareLock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { UserMenu } from "@/components/auth/user-menu";

const navItems = [
  {
    title: "Posts",
    url: "/studio/posts" as Route,
    icon: File01Icon,
  },
  {
    title: "Media",
    url: "/studio/media" as Route,
    icon: Image01Icon,
  },
  {
    title: "Series",
    url: "/studio/series" as Route,
    icon: Layers01Icon,
  },
  {
    title: "OAuth Clients",
    url: "/studio/oauth-clients" as Route,
    icon: SquareLock01Icon,
  },
  {
    title: "Docs",
    url: "/docs" as Route,
    icon: BookOpen01Icon,
  },
];

export function StudioShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Sidebar.Provider navigate={(href) => router.push(href as Route)}>
      <Sidebar>
        <Sidebar.Header>
          <span className="p-2 font-semibold">Content Studio</span>
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Content</Sidebar.GroupLabel>
            <Sidebar.Menu>
              {navItems.map((item) => (
                <Sidebar.MenuItem
                  key={item.title}
                  href={item.url}
                  isCurrent={pathname.startsWith(item.url)}
                >
                  <Sidebar.MenuIcon>
                    <HugeiconsIcon icon={item.icon} size={18} />
                  </Sidebar.MenuIcon>
                  <Sidebar.MenuLabel>{item.title}</Sidebar.MenuLabel>
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Rail />
      </Sidebar>
      <Sidebar.Main>
        <header className="flex h-14 items-center justify-between border-b px-4">
          <Sidebar.Trigger />
          <UserMenu />
        </header>
        <main className="p-4">{children}</main>
      </Sidebar.Main>
    </Sidebar.Provider>
  );
}
