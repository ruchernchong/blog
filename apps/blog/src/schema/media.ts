import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const media = pgTable(
  "media",
  {
    id: uuid().defaultRandom().primaryKey(),
    key: text().notNull().unique(),
    filename: text().notNull(),
    url: text().notNull(),
    mimeType: text().notNull(),
    size: bigint({ mode: "number" }).notNull(),
    width: integer(),
    height: integer(),
    alt: text(),
    caption: text(),
    uploadedById: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp({ withTimezone: true }),
  },
  (table) => [
    index().on(table.key),
    index().on(table.filename),
    index().on(table.mimeType),
    index().on(table.createdAt),
    index().on(table.deletedAt),
    index().on(table.uploadedById),
  ],
);

export type InsertMedia = typeof media.$inferInsert;
export type SelectMedia = typeof media.$inferSelect;
