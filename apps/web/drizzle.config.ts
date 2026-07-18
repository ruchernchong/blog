import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // NOTE: drizzle-kit v1 removed the top-level `casing: "snake_case"` option.
  // The runtime casing still lives on the drizzle() client in schema/index.ts.
});
