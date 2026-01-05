import { desc, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, sessions } from "@/schema";

export const getReferrers = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db
    .select({
      referrer: sessions.referrer,
      count: sql<number>`CAST(COUNT(${sessions.referrer}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.referrer}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.referrer)
    .orderBy(desc(sql`COUNT(${sessions.referrer})`));
};
