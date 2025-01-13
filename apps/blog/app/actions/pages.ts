"use server";

import db from "@/db";
import { pageViews } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const getPages = async () =>
  db
    .select({
      path: pageViews.path,
      count: sql<number>`CAST(COUNT(${pageViews.path}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${pageViews.path}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(pageViews)
    .groupBy(pageViews.path)
    .orderBy(desc(sql`COUNT('*')`));
