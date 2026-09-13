import type { TestingLibraryMatchers } from "@vitest/browser/jest-dom";
import type { ExpectPollOptions } from "vitest";
import type { Locator } from "vitest/browser";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_BASE_URL: string;
      DATABASE_URL: string;
    }
  }
}

// @vitest/browser augments the copy of `vitest` pnpm links for it, which is not
// the copy apps/web resolves (vitest lists @vitest/browser-playwright as an
// optional peer, a cycle pnpm cannot collapse). Redeclare its matchers here so
// `expect.element` and the DOM matchers typecheck in browser-mode tests.
declare module "vitest" {
  interface Assertion<R, T> extends TestingLibraryMatchers<R, T> {}

  interface ExpectStatic {
    element: <T extends HTMLElement | SVGElement | null | Locator>(
      element: T,
      options?: ExpectPollOptions,
    ) => Assertion<Promise<void>, HTMLElement | SVGElement | null>;
  }
}
