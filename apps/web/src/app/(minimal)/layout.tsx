import type { ReactNode } from "react";
import { MinimalFooter } from "./components/minimal-footer";
import { MinimalHeader } from "./components/minimal-header";

export default function MinimalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-minimal
      className="min-h-screen bg-background text-foreground antialiased"
    >
      <MinimalHeader />
      <main className="container mx-auto px-4 pt-24 pb-16">{children}</main>
      <MinimalFooter />
    </div>
  );
}
