import projects from "@/data/projects";
import { getGitHubStars } from "@/lib/github";
import { getTotalVisits } from "@/lib/queries/posthog";
import { getPublishedPostsCount } from "@/lib/queries/posts";
import { AppleFeaturedWork } from "../components/apple-featured-work";
import { AppleHeroSection } from "../components/apple-hero";
import { AppleLatestPosts } from "../components/apple-latest-posts";

export default async function PreviewPage() {
  const [postCount, githubStars, totalVisits] = await Promise.all([
    getPublishedPostsCount(),
    getGitHubStars(),
    getTotalVisits(),
  ]);

  return (
    <div className="flex flex-col">
      <AppleHeroSection
        postCount={postCount}
        githubStars={githubStars}
        totalVisits={totalVisits}
      />
      <AppleFeaturedWork projects={projects} />
      <AppleLatestPosts />
    </div>
  );
}
