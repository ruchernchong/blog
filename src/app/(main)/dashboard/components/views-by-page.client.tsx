"use client";

import { Card, Chip } from "@heroui/react";
import { motion } from "motion/react";

interface PageData {
  path: string;
  count: number;
  percent: number;
}

interface ViewsByPageClientProps {
  data: PageData[];
}

function getPageType(path: string): string {
  if (path === "/") return "home";
  if (path.startsWith("/blog")) return "blog";
  return "page";
}

function getPageName(path: string): string {
  if (path === "/") return "Home";
  // Remove leading slash and capitalise
  const name = path.slice(1).split("/").pop() || path;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function ViewsByPageRow({
  page,
  maxCount,
}: {
  page: PageData;
  maxCount: number;
}) {
  const pageType = getPageType(page.path);
  const pageName = getPageName(page.path);
  const barWidth = maxCount > 0 ? (page.count / maxCount) * 100 : 0;

  return (
    <div className="flex flex-col gap-2 border-border border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium text-sm">{pageName}</span>
          <Chip size="sm" variant="secondary" className="shrink-0">
            {pageType}
          </Chip>
        </div>
        <span className="shrink-0 font-medium text-sm tabular-nums">
          {page.count.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-default">
        <div
          className="h-full rounded-full bg-accent transition-all duration-500"
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

export function ViewsByPageClient({ data }: ViewsByPageClientProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Show top 10 pages
  const topPages = data.slice(0, 10);
  const maxCount = Math.max(...topPages.map((page) => page.count));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-10px_oklch(0.60_0.18_25/0.4)]">
        <Card.Header>
          <Card.Title>Views by Page</Card.Title>
        </Card.Header>
        <Card.Content>
          {topPages.map((page) => (
            <ViewsByPageRow key={page.path} page={page} maxCount={maxCount} />
          ))}
        </Card.Content>
      </Card>
    </motion.section>
  );
}
