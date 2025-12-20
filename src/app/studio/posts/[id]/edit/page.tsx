import { EditPostForm } from "@/app/studio/posts/[id]/edit/_components/edit-post-form";
import { getSeriesForSelector } from "@/lib/queries/series";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seriesOptions = await getSeriesForSelector();

  return <EditPostForm postId={id} seriesOptions={seriesOptions} />;
}
