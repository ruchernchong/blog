import type { ReactNode } from "react";
import { AppleFooter } from "./components/apple-footer";
import { AppleHeader } from "./components/apple-header";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-apple
      className="min-h-screen bg-background text-foreground antialiased"
    >
      <AppleHeader />
      <main className="container mx-auto px-6 pt-11">{children}</main>
      <AppleFooter />
    </div>
  );
}
