"use server";

import db from "@/db";
import { sessions } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

export const getBrowsers = async () =>
  db
    .select({
      browser: sessions.browser,
      count: sql<number>`CAST(COUNT(${sessions.browser}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.browser}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.browser)
    .orderBy(desc(sql`COUNT(${sessions.browser})`));
