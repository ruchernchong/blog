import { pgTable, uuid, text, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const pageViews = pgTable("page_views", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	path: text().notNull(),
	referrer: text(),
	browser: text(),
	os: text(),
	device: text(),
	screen: text(),
	language: text(),
	city: text(),
	country: text(),
	region: text(),
	latitude: text(),
	longitude: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	duration: integer(),
});
