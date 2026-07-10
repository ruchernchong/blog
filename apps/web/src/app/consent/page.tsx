import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { ConsentPanel } from "@/components/auth/consent-panel";

export const metadata: Metadata = {
  title: "Authorise",
  description: "Authorise an application to access your account",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <main className="grid min-h-svh place-items-center p-6">
      <div className="w-full max-w-sm">
        <ConsentPanel searchParams={searchParams} />
      </div>
    </main>
  );
}
