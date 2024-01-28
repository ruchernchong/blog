import type { MetadataRoute } from "next";
import { BASE_URL } from "@/config";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: {
      userAgent: "*",
    },
    host: BASE_URL,
    sitemap: `${BASE_URL}/sitemap.xml/`,
  };
};

export default robots;
