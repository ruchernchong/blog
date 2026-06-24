import type { ReactNode } from "react";
import { Footer } from "@/app/components/footer";
import { Header } from "@/app/components/header";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-7xl grow px-4 py-12 md:py-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
