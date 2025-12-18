"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

export const Providers = ({ children }: Readonly<{ children: ReactNode }>) => {
  return <NuqsAdapter>{children}</NuqsAdapter>;
};
