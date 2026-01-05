import { DashboardBrowsingIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { VisitsChart } from "@/app/(main)/analytics/_components/visits-chart";
import { LiveBadge } from "@/app/(main)/dashboard/_components/live-badge";
import { StatsGrid } from "@/app/(main)/dashboard/_components/stats-grid";
import { ViewsByPage } from "@/app/(main)/dashboard/_components/views-by-page";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";

const title = "Dashboard";
const description = "Real-time analytics and GitHub statistics.";
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
      <PageTitle
        title="Dashboard"
        description="Real-time analytics. All data updates automatically."
        icon={
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <HugeiconsIcon
              icon={DashboardBrowsingIcon}
              size={20}
              className="text-primary"
            />
          </div>
        }
        action={<LiveBadge />}
      />

      <Suspense>
        <StatsGrid />
      </Suspense>

      <Suspense>
        <ViewsByPage />
      </Suspense>

      <Suspense>
        <VisitsChart />
      </Suspense>
    </div>
  );
}
