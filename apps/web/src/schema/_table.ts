import { pgTableCreator } from "drizzle-orm/pg-core";

// Drizzle v1 moved the snake_case casing convention off the drizzle() client
// config and onto the table creator. Defining tables through this creator makes
// bare column builders (e.g. `text()` for `authorId`) resolve to snake_case DB
// columns (`author_id`), matching the existing database. Import `pgTable` from
// here — not from "drizzle-orm/pg-core" — for any table with unnamed columns.
export const pgTable = pgTableCreator((name) => name, "snake_case");
