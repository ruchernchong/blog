import { EyeIcon } from "@heroicons/react/24/outline";
import { LikeCounter } from "./LikeCounter";
import { ViewCounter } from "./ViewCounter";
import { getLikesByUser, getTotalLikes } from "@/app/actions/stats";

interface StatsBarProps {
  slug: string;
}

const StatsBar = async ({ slug }: StatsBarProps) => {
  const totalLikes = await getTotalLikes(slug);
  const likesByUser = await getLikesByUser(slug);

  return (
    <div className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-end">
      <div
        className={`flex w-full items-center justify-center gap-4 bg-gray-800/50 p-2 backdrop-blur md:w-auto md:flex-col md:items-center md:rounded-lg md:p-4`}
      >
        <LikeCounter
          slug={slug}
          initialTotalLikes={totalLikes}
          initialLikesByUser={likesByUser}
        />
        <div className="flex items-center gap-2 md:flex-col">
          <EyeIcon className="h-6 w-6 text-neutral-400" />
          <ViewCounter slug={slug} />
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
