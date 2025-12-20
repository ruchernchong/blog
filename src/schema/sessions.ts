import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const sessions = pgTable(
  "sessions",
  {
    id: uuid().defaultRandom().primaryKey(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    path: text().notNull(),
    referrer: text(),
    city: text(),
    country: text(),
    flag: text(),
    latitude: decimal({ precision: 8, scale: 6 }),
    longitude: decimal({ precision: 9, scale: 6 }),
    browser: text(),
    os: text(),
    device: text(),
    screen: text(),
    language: text(),
    duration: integer(),
  },
  (table) => ({
    createdAtIdx: index().on(table.createdAt),
    pathIdx: index().on(table.path),
    countryIdx: index().on(table.country),
    browserIdx: index().on(table.browser),
  }),
);

export type InsertSession = typeof sessions.$inferInsert;
export type SelectSession = typeof sessions.$inferSelect;
