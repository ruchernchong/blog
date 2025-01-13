import {
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  path: text("path").notNull(),
  referrer: text("referrer"),
  city: text("city"),
  country: text("country"),
  flag: text("flag"),
  latitude: decimal("latitude", { precision: 8, scale: 6 }),
  longitude: decimal("longitude", { precision: 9, scale: 6 }),
  browser: text("browser"),
  os: text("os"),
  device: text("device"),
  screen: text("screen"),
  language: text("language"),
  duration: integer("duration"),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
