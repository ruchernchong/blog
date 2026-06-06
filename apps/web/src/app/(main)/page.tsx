import type { WebSite, WithContext } from "schema-dts";
import { FeaturedWork } from "@/app/components/home/featured-work";
import { HeroSection } from "@/app/components/home/hero-section";
import { LatestPosts } from "@/app/components/home/latest-posts";
import { StructuredData } from "@/app/components/structured-data";
import { BASE_URL } from "@/config";
import projects from "@/data/projects";
import { getGitHubStars } from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getPublishedPostsCount } from "@/lib/queries/posts";

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

export default async function HomePage() {
  const [postCount, githubStars, totalVisits] = await Promise.all([
    getPublishedPostsCount(),
    getGitHubStars(),
    getTotalVisits(),
  ]);

  return (
    <>
      <StructuredData data={structuredData} />
      <div className="flex flex-col gap-12">
        <HeroSection
          postCount={postCount}
          githubStars={githubStars}
          totalVisits={totalVisits}
        />
        <FeaturedWork projects={projects} />
        <LatestPosts />
      </div>
    </>
  );
}
