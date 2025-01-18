"use server";

import db from "@/db";
import { sessions } from "@/db/schema";
import { desc, isNotNull, sql } from "drizzle-orm";

export const getDevices = async () =>
  db
    .select({
      device: sql<string>`INITCAP(${sessions.device})`,
      count: sql<number>`CAST(COUNT(${sessions.device}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.device}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.device)
    .orderBy(desc(sql`COUNT(${sessions.device})`));
