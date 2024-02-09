import type { MetadataRoute } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { BASE_URL } from "@/config";

const robots = (): MetadataRoute.Robots => {
  noStore();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml/`,
  };
};

export default robots;
