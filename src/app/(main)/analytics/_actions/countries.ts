import { desc, isNotNull, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { db, sessions } from "@/schema";

export const getCountries = async () => {
  "use cache";
  cacheLife("max");
  cacheTag("analytics");

  return db
    .select({
      country: sessions.country,
      flag: sessions.flag,
      count: sql<number>`CAST(COUNT(${sessions.country}) AS INTEGER)`,
      percent: sql<number>`ROUND(CAST(COUNT(${sessions.country}) * 100.0 / SUM(COUNT(*)) OVER () AS DECIMAL), 1)`,
    })
    .from(sessions)
    .where(isNotNull(sessions.country))
    .groupBy(sessions.country, sessions.flag)
    .orderBy(desc(sql`COUNT(${sessions.country})`));
};
