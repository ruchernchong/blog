import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import { DOMAIN_NAME } from "./src/config";

import vercel from "@astrojs/vercel/serverless";

export default defineConfig({
  site: `https://resume.${DOMAIN_NAME}`,
  integrations: [tailwind(), icon(), sitemap()],
  output: "server",
  adapter: vercel(),
});
