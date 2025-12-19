import {
  AnalyticsUpIcon,
  SourceCodeIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { MetricCard } from "@/app/(blog)/analytics/_components/metric-card";
import { Referrers } from "@/app/(blog)/analytics/_components/referrers";
import VisitsChart from "@/app/(blog)/analytics/_components/visits-chart";
import { PageTitle } from "@/components/shared/page-title";
import { serverTrpc } from "@/server";

const Dashboard = async () => {
  const [totalVisits, followers, stars, contributions, visits, referrers] =
    await Promise.all([
      serverTrpc.analytics.getTotalVisits(),
      serverTrpc.github.getFollowers(),
      serverTrpc.github.getStars(),
      serverTrpc.github.getContributions(),
      serverTrpc.analytics.getVisits(),
      serverTrpc.analytics.getReferrers(),
    ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8">
      <PageTitle
        title="Dashboard"
        description="Just sharing a quick snapshot of a few personal wins and milestones I've hit along the way - it's been a fun ride so far!"
        className="flex flex-col gap-4"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Site Visits"
          value={totalVisits ?? 0}
          icon={
            <HugeiconsIcon icon={AnalyticsUpIcon} size={32} strokeWidth={2} />
          }
        />
        <MetricCard
          title="GitHub Followers"
          value={followers ?? 0}
          icon={<SiGithub className="size-8" />}
        />
        <MetricCard
          title="GitHub Stars"
          value={stars ?? 0}
          icon={<HugeiconsIcon icon={StarIcon} size={32} strokeWidth={2} />}
        />
        <MetricCard
          title="Total Commits"
          value={
            contributions?.contributionsCollection.totalCommitContributions ?? 0
          }
          icon={
            <HugeiconsIcon icon={SourceCodeIcon} size={32} strokeWidth={2} />
          }
        />
      </div>
      <VisitsChart data={visits} />
      <Referrers data={referrers} />
    </div>
  );
};

export default Dashboard;
