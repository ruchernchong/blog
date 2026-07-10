import { connection } from "next/server";
import { Suspense } from "react";
import { StudioFormFallback } from "@/components/studio/studio-form-fallback";
import { getSeriesForSelector } from "@/lib/queries/series";
import { PostForm } from "./post-form";

export function NewPostEditor() {
  return (
    <Suspense fallback={<NewPostEditorFallback />}>
      <NewPostEditorContent />
    </Suspense>
  );
}

export function NewPostEditorFallback() {
  return <StudioFormFallback label="Loading new post editor" />;
}

async function NewPostEditorContent() {
  await connection();
  const seriesOptions = await getSeriesForSelector();

  return <PostForm seriesOptions={seriesOptions} />;
}
