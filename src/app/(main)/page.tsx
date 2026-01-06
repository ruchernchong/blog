import { Suspense } from "react";
import type { WebSite, WithContext } from "schema-dts";
import { FeaturedWork } from "@/app/_components/home/featured-work";
import { HeroSection } from "@/app/_components/home/hero-section";
import { LatestPosts } from "@/app/_components/home/latest-posts";
import { QuickStats } from "@/app/_components/home/quick-stats";
import { StructuredData } from "@/app/_components/structured-data";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";

const structuredData: WithContext<WebSite> = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Ru Chern",
  url: BASE_URL,
  description:
    "Personal blog and portfolio of Ru Chern, featuring posts on software development, technology and personal projects.",
  image: [
    {
      "@type": "ImageObject",
      url: `${BASE_URL}/cover-image.png`,
      width: "1200",
      height: "630",
    },
  ],
  sameAs: [
    "https://github.com/ruchernchong",
    "https://www.linkedin.com/in/ruchernchong",
    "https://twitter.com/ruchernchong",
  ],
};

export default function HomePage() {
  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-12">
        <HeroSection />
        <QuickStats />
        <FeaturedWork projects={projects} />
        <LatestPosts />
      </div>
    </>
  );
}
