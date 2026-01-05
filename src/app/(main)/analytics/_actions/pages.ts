import { desc, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, sessions } from "@/schema";

export const getPages = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db
    .select({
      path: sessions.path,
      count: sql<number>`CAST(COUNT(${sessions.path}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.path}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .groupBy(sessions.path)
    .orderBy(desc(sql`COUNT(${sessions.path})`));
};
