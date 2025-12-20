import {
  AnalyticsUpIcon,
  DashboardBrowsingIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Metadata } from "next";
import { VisitsChart } from "@/app/(blog)/analytics/_components/visits-chart";
import { LiveBadge } from "@/app/(blog)/dashboard/_components/live-badge";
import { StatCard } from "@/app/(blog)/dashboard/_components/stat-card";
import { ViewsByPage } from "@/app/(blog)/dashboard/_components/views-by-page";
import globalMetadata from "@/app/(blog)/metadata";
import { PageTitle } from "@/components/shared/page-title";
import { serverTrpc } from "@/server";

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

export default async function DashboardPage() {
  const [totalVisits, followers, stars, contributions, visits, pages] =
    await Promise.all([
      serverTrpc.analytics.getTotalVisits(),
      serverTrpc.github.getFollowers(),
      serverTrpc.github.getStars(),
      serverTrpc.github.getContributions(),
      serverTrpc.analytics.getVisits(),
      serverTrpc.analytics.getPages(),
    ]);

  const commits =
    contributions?.contributionsCollection.totalCommitContributions ?? 0;

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

      {/* Stats Grid - 2x2 on mobile, 4 columns on desktop */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={
            <HugeiconsIcon icon={AnalyticsUpIcon} size={20} strokeWidth={2} />
          }
          label="Total Visits"
          value={totalVisits ?? 0}
        />
        <StatCard
          icon={<SiGithub className="size-5" />}
          label="GitHub Followers"
          value={followers ?? 0}
        />
        <StatCard
          icon={<HugeiconsIcon icon={StarIcon} size={20} strokeWidth={2} />}
          label="GitHub Stars"
          value={stars ?? 0}
        />
        <StatCard
          icon={
            <HugeiconsIcon icon={SourceCodeIcon} size={20} strokeWidth={2} />
          }
          label="Total Commits"
          value={commits}
        />
      </div>

      {/* TODO: Currently Viewing section - requires @upstash/realtime migration */}
      {/* <CurrentlyViewing data={realtimeVisitors} /> */}

      <ViewsByPage data={pages} />

      <VisitsChart data={visits} />
    </div>
  );
}
