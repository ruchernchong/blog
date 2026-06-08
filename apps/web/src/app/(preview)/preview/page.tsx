import { FeaturedWork } from "@/app/components/home/featured-work";
import { LatestPosts } from "@/app/components/home/latest-posts";
import projects from "@/data/projects";
import { getGitHubStars } from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getPublishedPostsCount } from "@/lib/queries/posts";
import { AppleHeroSection } from "../components/apple-hero";

export default async function PreviewPage() {
  const [postCount, githubStars, totalVisits] = await Promise.all([
    getPublishedPostsCount(),
    getGitHubStars(),
    getTotalVisits(),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <AppleHeroSection
        postCount={postCount}
        githubStars={githubStars}
        totalVisits={totalVisits}
      />
      <FeaturedWork projects={projects} />
      <LatestPosts />
    </div>
  );
}
