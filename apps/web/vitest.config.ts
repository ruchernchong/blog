import path from "node:path";
import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    coverage: {
      enabled: true,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: ["src/**/*.test.ts"],
        },
      },
      {
        extends: true,
        // next/link reads process.env at import time, which does not exist in the browser
        define: { "process.env": "{}" },
        // Pre-bundle deps that only browser tests import. Discovering them
        // mid-run makes Vite reload, which loads a second React and fails
        // every hook with "Cannot read properties of null" on a cold cache.
        optimizeDeps: {
          include: ["nuqs", "nuqs/adapters/testing", "nuqs/server", "recharts"],
        },
        test: {
          name: "browser",
          include: ["src/**/*.test.tsx"],
          // Real browsers treat unstyled, zero-size elements as hidden
          setupFiles: ["./src/app/globals.css"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
