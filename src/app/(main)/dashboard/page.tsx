import { Link, Typography } from "@heroui/react";
import { DashboardBrowsingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { LastUpdated } from "@/app/(main)/dashboard/components/last-updated";
import { StatsGrid } from "@/app/(main)/dashboard/components/stats-grid";
import { ViewsByPage } from "@/app/(main)/dashboard/components/views-by-page";
import { VisitsChart } from "@/app/(main)/dashboard/components/visits-chart";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";

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
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <PageTitle
          title="Dashboard"
          description="Site visitor analytics and GitHub metrics."
          icon={
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
              <HugeiconsIcon
                icon={DashboardBrowsingIcon}
                size={20}
                className="text-accent"
              />
            </div>
          }
        />
        <LastUpdated />
      </div>

      <Suspense>
        <StatsGrid />
      </Suspense>
      <Suspense>
        <ViewsByPage />
      </Suspense>
      <Suspense>
        <VisitsChart />
      </Suspense>

      <div className="flex items-center justify-end">
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
    </div>
  );
}
