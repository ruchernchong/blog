import { z } from "zod";
// import { incrementLikes } from "@/app/_actions/stats";
import { incrementViews } from "@/app/_actions/stats";
import { getBrowsers } from "@/app/(main)/analytics/_actions/browsers";
import { getCountries } from "@/app/(main)/analytics/_actions/countries";
import { getDevices } from "@/app/(main)/analytics/_actions/devices";
import { getOS } from "@/app/(main)/analytics/_actions/os";
import { getPages } from "@/app/(main)/analytics/_actions/pages";
import { getReferrers } from "@/app/(main)/analytics/_actions/referrers";
import {
  getTotalVisits,
  getVisits,
} from "@/app/(main)/analytics/_actions/visits";
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
  // incrementLikes: publicProcedure
  //   .input(z.object({ slug: z.string() }))
  //   .mutation(({ input }) => incrementLikes(input.slug)),
  // getLikesByUser: publicProcedure
  //   .input(z.object({ slug: z.string(), userHash: z.string().optional() }))
  //   .query(({ input }) =>
  //     postStatsService.getLikesByUser(input.slug, input.userHash),
  //   ),
  // getTotalLikes: publicProcedure
  //   .input(z.object({ slug: z.string() }))
  //   .query(({ input }) => postStatsService.getTotalLikes(input.slug)),
  getTotalVisits: publicProcedure.query(() => getTotalVisits()),
});
