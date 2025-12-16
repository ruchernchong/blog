import { z } from "zod";
import { incrementLikes, incrementViews } from "@/app/(blog)/_actions/stats";
import { getBrowsers } from "@/app/(blog)/analytics/_actions/browsers";
import { getCountries } from "@/app/(blog)/analytics/_actions/countries";
import { getDevices } from "@/app/(blog)/analytics/_actions/devices";
import { getOS } from "@/app/(blog)/analytics/_actions/os";
import { getPages } from "@/app/(blog)/analytics/_actions/pages";
import { getReferrers } from "@/app/(blog)/analytics/_actions/referrers";
import {
  getTotalVisits,
  getVisits,
} from "@/app/(blog)/analytics/_actions/visits";
import { postStatsService } from "@/lib/services";
import { publicProcedure, router } from "../trpc";

export const analyticsRouter = router({
  getVisits: publicProcedure.query(() => getVisits()),
  getBrowsers: publicProcedure.query(() => getBrowsers()),
  getCountries: publicProcedure.query(() => getCountries()),
  getDevices: publicProcedure.query(() => getDevices()),
  getOS: publicProcedure.query(() => getOS()),
  getPages: publicProcedure.query(() => getPages()),
  getReferrers: publicProcedure.query(() => getReferrers()),
  getPostStats: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => postStatsService.getStats(input.slug)),
  incrementViews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ input }) => incrementViews(input.slug)),
  incrementLikes: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ input }) => incrementLikes(input.slug)),
  getLikesByUser: publicProcedure
    .input(z.object({ slug: z.string(), userHash: z.string().optional() }))
    .query(({ input }) =>
      postStatsService.getLikesByUser(input.slug, input.userHash),
    ),
  getTotalLikes: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => postStatsService.getTotalLikes(input.slug)),
  getTotalVisits: publicProcedure.query(() => getTotalVisits()),
});
