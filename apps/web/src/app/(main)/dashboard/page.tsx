import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { LastUpdated } from "@/app/(main)/dashboard/components/last-updated";
import { StatsGrid } from "@/app/(main)/dashboard/components/stats-grid";
import { ViewsByPage } from "@/app/(main)/dashboard/components/views-by-page";
import { VisitsChart } from "@/app/(main)/dashboard/components/visits-chart";
import globalMetadata from "@/app/metadata";
import { Eyebrow } from "@/components/eyebrow";
import { PageHeader } from "@/components/page-header";

const title = "Dashboard";
const description =
  "Site visitor analytics and GitHub metrics, updated on every page load.";
const canonical = "/dashboard";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    ...globalMetadata.openGraph,
    title,
    description,
    url: canonical,
  },
  twitter: {
    ...globalMetadata.twitter,
    title,
    description,
  },
  alternates: {
    canonical,
  },
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-3">
        <PageHeader
          eyebrow="Telemetry"
          title="Dashboard"
          description={description}
        />
        <LastUpdated />
      </div>

      <section className="flex flex-col gap-4">
        <Eyebrow>Overview</Eyebrow>
        <Suspense>
          <StatsGrid />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <Eyebrow>Views by page</Eyebrow>
        <Suspense>
          <ViewsByPage />
        </Suspense>
      </section>

      <section className="flex flex-col gap-4">
        <Eyebrow>Visits over time</Eyebrow>
        <Suspense>
          <VisitsChart />
        </Suspense>
      </section>

      <Link
        href="https://posthog.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-end gap-2 font-mono text-muted text-xs hover:text-foreground"
      >
        powered by
        <Image
          src="/images/posthog-logo.svg"
          alt="PostHog"
          width={800}
          height={140}
          className="h-3.5 w-auto dark:invert"
        />
      </Link>
    </div>
  );
}
