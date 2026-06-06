import type { ReactNode } from "react";
import { Footer } from "@/app/components/footer";
import { Header } from "@/app/components/header";
import { BackgroundEffects } from "@/components/background-effects";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <BackgroundEffects />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="container mx-auto my-16 grow px-4 py-24">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
