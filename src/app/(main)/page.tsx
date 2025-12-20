import type { WebSite, WithContext } from "schema-dts";
import { FeaturedWork } from "@/app/_components/home/featured-work";
import { HeroSection } from "@/app/_components/home/hero-section";
import { LatestPosts } from "@/app/_components/home/latest-posts";
import { QuickStats } from "@/app/_components/home/quick-stats";
import { StructuredData } from "@/app/_components/structured-data";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";
import { getPublishedPosts } from "@/lib/queries/posts";
import { serverTrpc } from "@/server";

async function HomePage() {
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

  const [totalVisits, stars, allPosts] = await Promise.all([
    serverTrpc.analytics.getTotalVisits(),
    serverTrpc.github.getStars(),
    getPublishedPosts(),
  ]);

  const latestPosts = allPosts.slice(0, 3);
  const postsCount = allPosts.length;

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-12">
        <HeroSection />
        <QuickStats
          visits={totalVisits ?? 0}
          posts={postsCount}
          stars={stars ?? 0}
        />
        <FeaturedWork projects={projects} />
        <LatestPosts posts={latestPosts} />
      </div>
    </>
  );
}

export default HomePage;
