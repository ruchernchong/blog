import type { Metadata } from "next";
import { Suspense } from "react";
import { ConsentForm } from "@/components/auth/consent-form";

export const metadata: Metadata = {
  title: "Authorise",
  description: "Authorise an application to access your account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConsentPage() {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm">
        <Suspense>
          <ConsentForm />
        </Suspense>
      </div>
    </main>
  );
}
