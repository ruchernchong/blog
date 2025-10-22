import { analyticsRouter } from "@/server/routers/analytics";
import { githubRouter } from "@/server/routers/github";
import { router } from "@/server/trpc";

export const appRouter = router({
  analytics: analyticsRouter,
  github: githubRouter,
});

export type AppRouter = typeof appRouter;
