"use client";

import { motion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/typography";

interface PageData {
  path: string;
  count: number;
  percent: number;
}

interface ViewsByPageProps {
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

function ViewsByPageRow({ page }: { page: PageData }) {
  const pageType = getPageType(page.path);
  const pageName = getPageName(page.path);

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 transition-colors hover:bg-muted/50">
      <div className="flex items-center gap-4">
        <span className="font-medium">{pageName}</span>
        <Badge variant="secondary" className="text-xs">
          {pageType}
        </Badge>
      </div>
      <span className="text-muted-foreground text-sm tabular-nums">
        {page.count.toLocaleString()} views
      </span>
    </div>
  );
}

export function ViewsByPage({ data }: ViewsByPageProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Show top 10 pages
  const topPages = data.slice(0, 10);

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-4"
    >
      <Typography variant="label" className="text-foreground">
        Views by Page
      </Typography>

      <div className="flex flex-col rounded-2xl bg-muted/50">
        {topPages.map((page) => (
          <ViewsByPageRow key={page.path} page={page} />
        ))}
      </div>
    </motion.section>
  );
}
