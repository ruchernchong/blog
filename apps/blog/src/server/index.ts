import { router } from "@/server/trpc";
import { analyticsRouter } from "@/server/routers/analytics";
import { githubRouter } from "@/server/routers/github";

export const appRouter = router({
  analytics: analyticsRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
