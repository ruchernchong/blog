import { connection } from "next/server";
import { Suspense } from "react";
import { EditPostForm } from "@/app/studio/posts/[id]/edit/_components/edit-post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

async function EditPostContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const seriesOptions = await getSeriesForSelector();
  return <EditPostForm postId={id} seriesOptions={seriesOptions} />;
}

export default function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <EditPostContent params={params} />
    </Suspense>
  );
}
