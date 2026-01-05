import {
  AnalyticsUpIcon,
  DashboardBrowsingIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import type { Metadata } from "next";
import { Suspense } from "react";
import { getPages } from "@/app/(main)/analytics/_actions/pages";
import {
  getTotalVisits,
  getVisits,
} from "@/app/(main)/analytics/_actions/visits";
import { VisitsChart } from "@/app/(main)/analytics/_components/visits-chart";
import { LiveBadge } from "@/app/(main)/dashboard/_components/live-badge";
import { StatCard } from "@/app/(main)/dashboard/_components/stat-card";
import { ViewsByPage } from "@/app/(main)/dashboard/_components/views-by-page";
import globalMetadata from "@/app/metadata";
import { PageTitle } from "@/components/page-title";
import {
  getGitHubContributions,
  getGitHubFollowers,
  getGitHubStars,
} from "@/lib/github";

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

async function StatsGrid() {
  const [totalVisits, followers, stars, contributions] = await Promise.all([
    getTotalVisits(),
    getGitHubFollowers(),
    getGitHubStars(),
    getGitHubContributions(),
  ]);

  const commits =
    contributions?.contributionsCollection.totalCommitContributions ?? 0;

  return (
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
        icon={<HugeiconsIcon icon={SourceCodeIcon} size={20} strokeWidth={2} />}
        label="Total Commits"
        value={commits}
      />
    </div>
  );
}

async function ViewsByPageContent() {
  const pages = await getPages();
  return <ViewsByPage data={pages} />;
}

async function VisitsChartContent() {
  const visits = await getVisits();
  return <VisitsChart data={visits} />;
}

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
        <ViewsByPageContent />
      </Suspense>

      <Suspense>
        <VisitsChartContent />
      </Suspense>
    </div>
  );
}
