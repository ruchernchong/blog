import { incrementViews } from "@/app/(blog)/_actions/stats";

interface Props {
  slug: string;
}

export const ViewCounter = async ({ slug }: Props) => {
  const stats = await incrementViews(slug);

  return <div className="text-neutral-400 text-sm">{stats.views}</div>;
};
