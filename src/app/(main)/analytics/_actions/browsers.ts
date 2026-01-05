import { desc, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, sessions } from "@/schema";

export const getBrowsers = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db
    .select({
      browser: sessions.browser,
      count: sql<number>`CAST(COUNT(${sessions.browser}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.browser}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.browser)
    .orderBy(desc(sql`COUNT(${sessions.browser})`));
};
