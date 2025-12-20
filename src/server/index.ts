import { analyticsRouter } from "@/server/routers/analytics";
import { githubRouter } from "@/server/routers/github";
import { createCallerFactory, router } from "@/server/trpc";

export const appRouter = router({
  analytics: analyticsRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;

// Server-side caller for use in Server Components
export const serverTrpc = createCallerFactory(appRouter)({});
