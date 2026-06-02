import { githubRouter } from "@/server/routers/github";
import { createCallerFactory, router } from "@/server/trpc";

export const appRouter = router({
  github: githubRouter,
});

export type AppRouter = typeof appRouter;

// Server-side caller for use in Server Components
export const serverTrpc = createCallerFactory(appRouter)({});
