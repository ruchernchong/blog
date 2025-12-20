import type { ReactNode } from "react";
import { Footer } from "@/app/_components/footer";
import { Header } from "@/app/_components/header";
import Analytics from "@/components/analytics-tracker";
import { BackgroundEffects } from "@/components/background-effects";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <>
      <BackgroundEffects />
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto my-16 w-screen max-w-4xl grow px-4 py-24">
          {children}
        </main>
        <Footer />
      </div>
      <Analytics />
    </>
  );
}
