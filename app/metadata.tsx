import type { Metadata } from "next";
import { HOST_URL } from "@/config";

const title: string = "Ru Chern";
const description: string =
  "Frontend Developer from Singapore. Interested in automating workflows and building in React, Node, and Typescript.";

const metadata: Metadata = {
  title: {
    default: "Ru Chern",
    template: "%s | Ru Chern",
  },
  description: description,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: title,
    description: description,
    url: "/",
    siteName: title,
    images: [
      {
        url: `${HOST_URL}/cover-image.jpg`,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en-SG",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: title,
    description: description,
    creator: "@ruchernchong",
    images: `${HOST_URL}/cover-image.jpg`,
  },
};

export default metadata;
