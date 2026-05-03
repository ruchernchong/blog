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
        <main className="mx-auto my-16 w-screen max-w-4xl grow px-4 py-24 print:my-0 print:max-w-none print:px-0 print:py-0">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}
