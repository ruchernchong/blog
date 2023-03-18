import { createClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import { SANITY_API_VERSION } from "@/config";

const sanityConfig = {
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  useCdn: process.env.NODE_ENV !== "production",
  apiVersion: SANITY_API_VERSION,
};

export const sanityClient = createClient(sanityConfig);

export const previewClient = createClient({
  ...sanityConfig,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
});

export const getClient = (preview) => (preview ? previewClient : sanityClient);

const builder = imageUrlBuilder(sanityClient);
export const urlFor = (source) => builder.image(source);
