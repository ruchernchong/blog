import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  regions: ["sin1"],
  git: {
    deploymentEnabled: {
      "dependabot/*": false,
      "renovate/*": false,
    },
  },
};
