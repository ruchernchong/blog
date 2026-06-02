import { connection } from "next/server";
import { Suspense } from "react";
import { PostForm } from "@/app/studio/posts/new/components/post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

async function NewPostContent() {
  await connection();
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
