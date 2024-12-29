import { BASE_URL } from "@/config";
import type { Metadata } from "next";

const title = {
  default: "Ru Chern",
  template: "%s | Ru Chern",
};

const description =
  "Frontend Developer from Singapore. Interested in automating workflows and building in React, Node, and Typescript.";
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
