import { connection } from "next/server";
import { Suspense } from "react";
import { EditPostForm } from "@/app/studio/posts/[id]/edit/_components/edit-post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  return (
    <Suspense>
      <EditPostContent params={params} />
    </Suspense>
  );
}

async function EditPostContent({ params }: PageProps) {
  await connection();

  const { id } = await params;

  const seriesOptions = await getSeriesForSelector();

  return <EditPostForm postId={id} seriesOptions={seriesOptions} />;
}
