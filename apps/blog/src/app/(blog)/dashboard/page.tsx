import {
  AnalyticsUpIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { LiveBadge } from "@/app/(blog)/dashboard/_components/live-badge";
import { StatCard } from "@/app/(blog)/dashboard/_components/stat-card";
import { ViewsByPage } from "@/app/(blog)/dashboard/_components/views-by-page";
import VisitsChart from "@/app/(blog)/analytics/_components/visits-chart";
import { serverTrpc } from "@/server";

async function DashboardPage() {
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
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-4xl tracking-tight">Dashboard</h1>
          <LiveBadge />
        </div>
        <p className="text-muted-foreground">
          Real-time analytics. All data updates automatically.
        </p>
      </header>

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

export default DashboardPage;
