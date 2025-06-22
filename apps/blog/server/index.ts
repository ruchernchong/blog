import { router } from "@/server/trpc";
import { analyticsRouter } from "@/server/routers/analytics";

export const appRouter = router({
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
