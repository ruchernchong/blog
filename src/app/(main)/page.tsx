import type { WebSite, WithContext } from "schema-dts";
import { FeaturedWork } from "@/app/components/home/featured-work";
import { HeroSection } from "@/app/components/home/hero-section";
import { LatestPosts } from "@/app/components/home/latest-posts";
// import { Suspense } from "react";
// import { QuickStats } from "@/app/components/home/quick-stats";
// import { SiteVisits } from "@/app/components/home/site-visits";
import { StructuredData } from "@/app/components/structured-data";
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
        {/* TODO: Re-enable homepage visits after caching Umami reads to avoid request-time function invocations. */}
        {/* <Suspense fallback={<QuickStats />}>
          <SiteVisits />
        </Suspense> */}
        <FeaturedWork projects={projects} />
        <LatestPosts />
      </div>
    </>
  );
}
