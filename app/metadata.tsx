import type { Metadata } from "next";
import { BASE_URL } from "@/config";

const title = "Ru Chern";
const description =
  "Frontend Developer from Singapore. Interested in automating workflows and building in React, Node, and Typescript.";

const metadata: Metadata = {
  title: {
    default: "Ru Chern",
    template: "%s | Ru Chern",
  },
  description,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: { default: "Ru Chern", template: "%s | Ru Chern" },
    description,
    url: BASE_URL,
    siteName: title,
    images: [
      {
        url: `${BASE_URL}/images/cover-image.png`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en-SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: { default: "Ru Chern", template: "%s | Ru Chern" },
    description,
    creator: "@ruchernchong",
    images: `${BASE_URL}/images/cover-image.png`,
  },
};

export default metadata;
