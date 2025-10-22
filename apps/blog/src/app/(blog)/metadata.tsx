import type { Metadata } from "next";
import { BASE_URL, SITE_DESCRIPTION } from "@/config";

const title = {
  default: "Ru Chern",
  template: "%s - Ru Chern",
};

const description = SITE_DESCRIPTION;
const url = new URL(BASE_URL);

const metadata: Metadata = {
  metadataBase: url,
  title,
  description,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title,
    description,
    url,
    siteName: title.default,
    locale: "en_SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@ruchernchong",
    title,
    description,
  },
};

export default metadata;
