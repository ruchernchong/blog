import type { ReactNode } from "react";
import { Footer } from "@/app/components/footer";
import { Header } from "@/app/components/header";

export default function MainLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto grow px-4 py-12">{children}</main>
      <Footer />
    </div>
  );
}
