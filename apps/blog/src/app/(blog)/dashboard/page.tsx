"use client";

import { CodeBracketIcon, StarIcon } from "@heroicons/react/24/solid";
import { SiGithub } from "@icons-pack/react-simple-icons";
import { MetricCard } from "@/components/metric-card";
import { PageTitle } from "@/components/page-title";
import { trpc } from "@/trpc/client";
import { ChartColumnIncreasing } from "lucide-react";
import VisitsChart from "@/components/visits-chart";
import React from "react";
import { Referrers } from "@/components/analytics/referrers";

const Dashboard = () => {
  const { data: totalVisits, isLoading: totalVisitsLoading } =
    trpc.analytics.getTotalVisits.useQuery();
  const { data: followers, isLoading: followersLoading } =
    trpc.github.getFollowers.useQuery();
  const { data: stars, isLoading: starsLoading } =
    trpc.github.getStars.useQuery();
  const { data: contributions, isLoading: contributionsLoading } =
    trpc.github.getContributions.useQuery();

  return (
    <div className="mx-auto max-w-4xl flex flex-col gap-8">
      <PageTitle
        title="Dashboard"
        description="📊 Just sharing a quick snapshot of a few personal wins and milestones I've hit along the way—it's been a fun ride so far!"
        className="flex flex-col gap-4"
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total Site Visits"
          value={totalVisitsLoading ? "..." : (totalVisits ?? 0)}
          icon={<ChartColumnIncreasing />}
        />
        <MetricCard
          title="GitHub Followers"
          value={followersLoading ? "..." : (followers ?? 0)}
          icon={<SiGithub className="size-8" />}
        />
        <MetricCard
          title="GitHub Stars"
          value={starsLoading ? "..." : (stars ?? 0)}
          icon={<StarIcon className="size-8" />}
        />
        <MetricCard
          title="Total Commits"
          value={
            contributionsLoading
              ? "..."
              : (contributions?.contributionsCollection
                  .totalCommitContributions ?? 0)
          }
          icon={<CodeBracketIcon className="size-8" />}
        />
      </div>
      <VisitsChart />
      <Referrers />
    </div>
  );
};

export default Dashboard;
