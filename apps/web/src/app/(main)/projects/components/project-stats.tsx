import { Suspense } from "react";
import { StatFigure } from "@/app/components/stat-figure";
import projects from "@/data/projects";
import { getGitHubStars } from "@/lib/github";
import { isGitHubLink } from "./project-card";

const shipped = projects.length;
const liveNow = projects.filter((project) =>
  project.links.some((link) => !isGitHubLink(link)),
).length;

function StatRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap gap-9 border-separator border-y py-6">
      {children}
    </div>
  );
}

export function ProjectStats() {
  return (
    <Suspense fallback={<ProjectStatsFallback />}>
      <ProjectStatsContent />
    </Suspense>
  );
}

function ProjectStatsFallback() {
  return (
    <StatRow>
      <StatFigure label="shipped" value={shipped} />
      <div className="flex flex-col gap-1">
        <div className="h-8 w-16 animate-pulse rounded bg-default" />
        <span className="text-muted text-sm">GitHub stars</span>
      </div>
      <StatFigure label="live now" value={liveNow} />
    </StatRow>
  );
}

async function ProjectStatsContent() {
  const stars = await getGitHubStars().catch(() => 0);

  return (
    <StatRow>
      <StatFigure label="shipped" value={shipped} />
      <StatFigure label="GitHub stars" value={stars} compact />
      <StatFigure label="live now" value={liveNow} />
    </StatRow>
  );
}
