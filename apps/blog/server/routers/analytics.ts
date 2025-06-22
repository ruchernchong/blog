import { z } from "zod";
import { publicProcedure, router } from "../trpc";
import { getVisits } from "@/app/actions/analytics/visits";
import { getBrowsers } from "@/app/actions/analytics/browsers";
import { getCountries } from "@/app/actions/analytics/countries";
import { getDevices } from "@/app/actions/analytics/devices";
import { getOS } from "@/app/actions/analytics/os";
import { getPages } from "@/app/actions/analytics/pages";
import { getReferrers } from "@/app/actions/analytics/referrers";
import {
  getPostStats,
  incrementViews,
  incrementLikes,
  getLikesByUser,
  getTotalLikes,
} from "@/app/actions/stats";

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
    .query(({ input }) => getPostStats(input.slug)),
  incrementViews: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ input }) => incrementViews(input.slug)),
  incrementLikes: publicProcedure
    .input(z.object({ slug: z.string() }))
    .mutation(({ input }) => incrementLikes(input.slug)),
  getLikesByUser: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getLikesByUser(input.slug)),
  getTotalLikes: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ input }) => getTotalLikes(input.slug)),
});
