import { defineConfig } from "drizzle-kit";

export default defineConfig({
  // Skip colocated tests: relations.test.ts imports Vitest, which drizzle-kit cannot require.
  schema: "./src/schema/!(*.test).ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  casing: "snake_case",
});
