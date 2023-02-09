import { SANITY_API_VERSION } from "config";

export const sanityConfig = {
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  useCdn: process.env.NODE_ENV !== "production",
  apiVersion: SANITY_API_VERSION
};
