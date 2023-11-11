import type { Metadata } from "next";
import { HOST_URL } from "@/config";

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
    url: HOST_URL,
    siteName: title,
    images: [
      {
        url: `${HOST_URL}/cover-image.png`,
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
    images: `${HOST_URL}/cover-image.png`,
  },
};

export default metadata;
