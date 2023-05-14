import { MetadataRoute } from "next";
import { HOST_URL } from "@/config";

const robots = (): MetadataRoute.Robots => {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${HOST_URL}/sitemap.xml`,
  };
};

export default robots;
