"use server";

import db from "@/db";
import { pageViews } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const getReferrers = async () =>
  db
    .select({
      referrer: pageViews.referrer,
      count: sql<number>`CAST(COUNT(${pageViews.referrer}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${pageViews.referrer}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(pageViews)
    .groupBy(pageViews.referrer)
    .orderBy(desc(sql`COUNT('*')`));
