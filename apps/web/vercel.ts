import type { VercelConfig } from "@vercel/config/v1";

export const config: VercelConfig = {
  ignoreCommand:
    'case "$VERCEL_GIT_COMMIT_MESSAGE" in *"[skip ci]"*) exit 0 ;; *) exit 1 ;; esac',
  regions: ["sin1"],
  // Bun 1.4 (the Rust rewrite); 1.3.14 segfaults in `next build` on Next
  // 16.3+. Next.js with Cache Components must also build under Bun.
  bunVersion: "1.4.x",
  git: {
    deploymentEnabled: {
      "dependabot/*": false,
      "renovate/*": false,
    },
  },
};
