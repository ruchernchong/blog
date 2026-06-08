import projects from "@/data/projects";
import { getGitHubStars } from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getPublishedPostsCount } from "@/lib/queries/posts";
import { MinimalFeaturedWork } from "./components/minimal-featured-work";
import { MinimalHeroSection } from "./components/minimal-hero-section";
import { MinimalLatestPosts } from "./components/minimal-latest-posts";

export default async function MinimalHomePage() {
  const [postCount, githubStars, totalVisits] = await Promise.all([
    getPublishedPostsCount(),
    getGitHubStars(),
    getTotalVisits(),
  ]);

  return (
    <div className="flex flex-col gap-16">
      <MinimalHeroSection
        postCount={postCount}
        githubStars={githubStars}
        totalVisits={totalVisits}
      />
      <MinimalFeaturedWork projects={projects} />
      <MinimalLatestPosts />
    </div>
  );
}
