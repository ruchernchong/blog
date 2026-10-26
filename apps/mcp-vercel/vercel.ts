import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  framework: "hono",
  ignoreCommand:
    'case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[skip ci]"*) exit 0 ;; *) exit 1 ;; esac',
  // Next to Neon (ap-southeast-1); Hobby allows a single region.
  regions: ["sin1"],
  fluid: true,
  git: {
    deploymentEnabled: {
      "dependabot/*": false,
      "renovate/*": false,
    },
  },
};
