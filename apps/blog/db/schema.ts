import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const pageViews = pgTable("page_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  browser: text("browser"),
  os: text("os"),
  device: text("device"),
  screen: text("screen"),
  language: text("language"),
  city: text("city"),
  country: text("country"),
  region: text("region"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  duration: integer("duration"),
});

export type PageView = typeof pageViews.$inferSelect;
export type NewPageView = typeof pageViews.$inferInsert;
