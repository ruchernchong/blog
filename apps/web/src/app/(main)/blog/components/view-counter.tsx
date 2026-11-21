import { incrementViews } from "@/app/_actions/stats";

interface Props {
  slug: string;
}

export const ViewCounter = async ({ slug }: Props) => {
  const views = await incrementViews(slug);

  return <div className="text-neutral-400 text-sm">{views}</div>;
};
