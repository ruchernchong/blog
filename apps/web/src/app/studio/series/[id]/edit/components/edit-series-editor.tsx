import { Card, Skeleton } from "@heroui/react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SeriesForm } from "@/components/studio/series-form";
import { StudioFormFallback } from "@/components/studio/studio-form-fallback";
import { getSeriesById } from "@/lib/queries/series";
import { SeriesPostsManager } from "./series-posts-manager";

const SERIES_POST_FALLBACKS = [
  "first-post",
  "second-post",
  "third-post",
] as const;

interface EditSeriesEditorProps {
  params: Promise<{ id: string }>;
}

export function EditSeriesEditor({ params }: EditSeriesEditorProps) {
  return (
    <Suspense fallback={<EditSeriesEditorFallback />}>
      <EditSeriesEditorContent params={params} />
    </Suspense>
  );
}

export function EditSeriesEditorFallback() {
  return (
    <div className="flex flex-col gap-8">
      <StudioFormFallback label="Loading series editor" />
      <Card aria-hidden="true">
        <Card.Content className="flex flex-col gap-4">
          <Skeleton className="h-6 w-40 rounded-lg" />
          {SERIES_POST_FALLBACKS.map((post) => (
            <Skeleton key={post} className="h-10 w-full rounded-lg" />
          ))}
        </Card.Content>
      </Card>
    </div>
  );
}

async function EditSeriesEditorContent({ params }: EditSeriesEditorProps) {
  await connection();
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
