import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pageViews = pgTable("page_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  city: text("city"),
  country: text("country"),
  flag: text("flag"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  browser: text("browser"),
  os: text("os"),
  device: text("device"),
  screen: text("screen"),
  language: text("language"),
  duration: integer("duration"),
});

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
