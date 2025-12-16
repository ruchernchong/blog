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
import { publicProcedure, router } from "../trpc";

export const analyticsRouter = router({
  getVisits: publicProcedure.query(() => getVisits()),
  getBrowsers: publicProcedure.query(() => getBrowsers()),
  getCountries: publicProcedure.query(() => getCountries()),
  getDevices: publicProcedure.query(() => getDevices()),
  getOS: publicProcedure.query(() => getOS()),
  getPages: publicProcedure.query(() => getPages()),
  getReferrers: publicProcedure.query(() => getReferrers()),
  getTotalVisits: publicProcedure.query(() => getTotalVisits()),
});
