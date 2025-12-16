"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <ConvexProvider client={convex}>
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
    </ConvexProvider>
  );
};
