import { publicProcedure, router } from "../trpc";
import {
  getGitHubFollowers,
  getGitHubStars,
  getGitHubContributions,
} from "@/lib/github";

export const githubRouter = router({
  getFollowers: publicProcedure.query(() => getGitHubFollowers()),
  getStars: publicProcedure.query(() => getGitHubStars()),
  getContributions: publicProcedure.query(() => getGitHubContributions()),
});
