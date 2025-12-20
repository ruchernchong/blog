import { PostForm } from "@/app/studio/posts/new/_components/post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

export default async function NewPostPage() {
  const seriesOptions = await getSeriesForSelector();

  return <PostForm seriesOptions={seriesOptions} />;
}
