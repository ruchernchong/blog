import db from "@/db";
import { sessions } from "@/db/schema";
import { asc, count, sql } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

export type Visit = {
  date: string;
  visits: number;
};

const formatDate = (column: PgColumn) =>
  sql<string>`DATE(${column}) AT TIME ZONE 'ASIA/SINGAPORE'`;

export const getVisits = async () =>
  db
    .select({
      date: formatDate(sessions.createdAt),
      visits: count(),
    })
    .from(sessions)
    .groupBy(formatDate(sessions.createdAt))
    .orderBy(asc(formatDate(sessions.createdAt)));
