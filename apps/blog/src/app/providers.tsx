"use client";

import type { ReactNode } from "react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export const Providers = ({ children }: { children: ReactNode }) => (
  <HeroUIProvider>
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  </HeroUIProvider>
);
