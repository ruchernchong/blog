import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as auth from "./auth";
import * as posts from "./posts";
import * as sessions from "./sessions";

const sql = neon(process.env.DATABASE_URL);

const schema = { ...auth, ...posts, ...sessions };

export const db = drizzle(sql, {
  schema,
  casing: "snake_case",
});

// Re-export tables and types for easy importing
export * from "./auth";
export * from "./posts";
export * from "./sessions";
