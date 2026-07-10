import { connection } from "next/server";
import { Suspense } from "react";
import { StudioFormFallback } from "@/components/studio/studio-form-fallback";
import { getSeriesForSelector } from "@/lib/queries/series";
import { EditPostForm } from "./edit-post-form";

interface EditPostEditorProps {
  params: Promise<{ id: string }>;
}

export function EditPostEditor({ params }: EditPostEditorProps) {
  return (
    <Suspense fallback={<EditPostEditorFallback />}>
      <EditPostEditorContent params={params} />
    </Suspense>
  );
}

export function EditPostEditorFallback() {
  return <StudioFormFallback label="Loading post editor" />;
}

async function EditPostEditorContent({ params }: EditPostEditorProps) {
  await connection();
  const { id } = await params;
  const seriesOptions = await getSeriesForSelector();

  return <EditPostForm postId={id} seriesOptions={seriesOptions} />;
}
