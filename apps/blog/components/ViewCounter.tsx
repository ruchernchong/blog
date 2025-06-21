import { incrementViews } from "@/app/actions/stats";

interface Props {
  slug: string;
}

export const ViewCounter = async ({ slug }: Props) => {
  const stats = await incrementViews(slug);

  return (
    <div className="text-sm text-neutral-400">
      {stats.views}
    </div>
  );
};
