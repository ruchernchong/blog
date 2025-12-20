import { notFound } from "next/navigation";
import { EditSeriesForm } from "@/app/studio/series/[id]/edit/_components/edit-series-form";
import { SeriesPostsManager } from "@/app/studio/series/[id]/edit/_components/series-posts-manager";
import { getSeriesById } from "@/lib/queries/series";

interface EditSeriesPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSeriesPage({ params }: EditSeriesPageProps) {
  const { id } = await params;
  const series = await getSeriesById(id);

  if (!series) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <EditSeriesForm series={series} />
      <SeriesPostsManager seriesId={id} />
    </div>
  );
}
