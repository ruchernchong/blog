import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  ignoreCommand:
    'case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[skip ci]"*) exit 0 ;; *) exit 1 ;; esac',
  regions: ["sin1"],
  git: {
    deploymentEnabled: {
      "dependabot/*": false,
      "renovate/*": false,
    },
  },
};
