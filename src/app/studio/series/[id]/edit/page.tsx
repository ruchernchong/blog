import { notFound } from "next/navigation";
import { SeriesPostsManager } from "@/app/studio/series/[id]/edit/_components/series-posts-manager";
import { SeriesForm } from "@/components/studio/series-form";
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
    <div className="flex flex-col gap-8">
      <SeriesForm series={series} />
      <SeriesPostsManager seriesId={id} />
    </div>
  );
}
