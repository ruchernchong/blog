import { asc, count, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { cacheLife, cacheTag } from "next/cache";
import { db, sessions } from "@/schema";

export type Visit = {
  date: string;
  visits: number;
};

const formatDate = (column: PgColumn) =>
  sql<string>`DATE
    (${column})
    AT TIME ZONE 'ASIA/SINGAPORE'`;

export const getVisits = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db
    .select({
      date: formatDate(sessions.createdAt),
      visits: count(),
    })
    .from(sessions)
    .groupBy(formatDate(sessions.createdAt))
    .orderBy(asc(formatDate(sessions.createdAt)));
};

export const getTotalVisits = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db.$count(sessions);
};
