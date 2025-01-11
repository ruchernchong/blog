import { incrementViews } from "@/app/actions/stats";

interface Props {
  slug: string;
}

export const ViewCounter = async ({ slug }: Props) => {
  const stats = await incrementViews(slug);

  return (
    <p
      className="text-sm text-neutral-400"
      data-umami-event="view-counter-display"
      data-umami-event-slug={slug}
      data-umami-event-views={stats.views}
    >
      {stats.views} views
    </p>
  );
};