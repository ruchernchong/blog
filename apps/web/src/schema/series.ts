import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { posts } from "./posts";

export const series = pgTable(
  "series",
  {
    id: uuid().defaultRandom().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    description: text(),
    status: text({ enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    coverImage: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => {
    return [
      index().on(table.slug),
      index().on(table.status),
      index().on(table.deletedAt),
    ];
  },
);

export const seriesRelations = relations(series, ({ many }) => ({
  posts: many(posts),
}));

export type InsertSeries = typeof series.$inferInsert;
export type SelectSeries = typeof series.$inferSelect;
