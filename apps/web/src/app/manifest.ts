import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f7",
    theme_color: "#d4513b",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon?size=64",
        sizes: "64x64",
        type: "image/png",
      },
      {
        src: "/icon?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon?size=512",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
