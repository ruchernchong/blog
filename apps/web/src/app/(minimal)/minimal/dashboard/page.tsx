import { Link } from "@heroui/react";
import Image from "next/image";
import { Suspense } from "react";
import { LastUpdated } from "@/app/(main)/dashboard/components/last-updated";
import { StatsGrid } from "@/app/(main)/dashboard/components/stats-grid";
import { ViewsByPage } from "@/app/(main)/dashboard/components/views-by-page";
import { VisitsChart } from "@/app/(main)/dashboard/components/visits-chart";

function MinimalCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border p-6">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold text-foreground">{title}</h2>
        {description && <p className="text-muted text-sm">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function MinimalDashboardPage() {
  return (
    <div className="flex flex-col gap-12 py-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-bold text-4xl text-foreground tracking-tight md:text-5xl">
          Dashboard.
        </h1>
        <p className="max-w-xl text-lg text-muted leading-relaxed">
          Site visitor analytics and GitHub metrics, updated on every page load.
        </p>
        <LastUpdated />
      </div>

      <MinimalCard title="Overview" description="Site & GitHub metrics">
        <Suspense>
          <StatsGrid />
        </Suspense>
      </MinimalCard>

      <Suspense>
        <ViewsByPage />
      </Suspense>

      <MinimalCard title="Visits Over Time" description="Daily traffic">
        <Suspense>
          <VisitsChart />
        </Suspense>
      </MinimalCard>

      <div className="flex items-center justify-end">
        <Link
          href="https://posthog.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <span className="text-muted text-xs">Powered by</span>
          <Image
            src="/images/posthog-logo.svg"
            alt="PostHog"
            width={800}
            height={140}
            className="h-4 w-auto"
          />
        </Link>
      </div>
    </div>
  );
}
