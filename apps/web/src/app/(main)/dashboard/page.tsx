import { Link, Typography } from "@heroui/react";
import type { Metadata } from "next";
import Image from "next/image";
import { LastUpdated } from "@/app/(main)/dashboard/components/last-updated";
import { StatsGrid } from "@/app/(main)/dashboard/components/stats-grid";
import { ViewsByPage } from "@/app/(main)/dashboard/components/views-by-page";
import { VisitsChart } from "@/app/(main)/dashboard/components/visits-chart";
import { PageHeader } from "@/app/components/page-header";
import { SurfaceCard } from "@/app/components/surface-card";
import globalMetadata from "@/app/metadata";

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
    <SurfaceCard width="wide" className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          title="Dashboard"
          description="Live analytics for ruchern.dev, powered by PostHog."
        />
        <LastUpdated />
      </div>

      <StatsGrid />

      <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
        <ViewsByPage />
        <VisitsChart />
      </div>

      <div className="flex items-center justify-center">
        <Link
          href="https://posthog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <Typography type="body-xs" color="muted">
            Powered by
          </Typography>
          <Image
            src="/images/posthog-logo.svg"
            alt="PostHog"
            width={800}
            height={140}
            className="h-4 w-auto dark:invert"
          />
        </Link>
      </div>
    </SurfaceCard>
  );
}
