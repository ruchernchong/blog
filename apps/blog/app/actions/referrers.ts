"use server";

import db from "@/db";
import { sessions } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const getReferrers = async () =>
  db
    .select({
      referrer: sessions.referrer,
      count: sql<number>`CAST(COUNT(${sessions.referrer}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.referrer}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.referrer)
    .orderBy(desc(sql`COUNT(${sessions.referrer})`));
