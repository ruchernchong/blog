import { Suspense } from "react";
import { PostForm } from "@/app/studio/posts/new/_components/post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

async function NewPostContent() {
  const seriesOptions = await getSeriesForSelector();
  return <PostForm seriesOptions={seriesOptions} />;
}

export default function NewPostPage() {
  return (
    <Suspense>
      <NewPostContent />
    </Suspense>
  );
}
