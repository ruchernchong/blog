import { EyeIcon } from "@heroicons/react/24/outline";
import { getLikesByUser, getTotalLikes } from "@/app/(blog)/_actions/stats";
import { LikeCounter } from "@/app/(blog)/blog/_components/like-counter";
import { ViewCounter } from "@/app/(blog)/blog/_components/view-counter";

interface StatsBarProps {
  slug: string;
}

const StatsBar = async ({ slug }: StatsBarProps) => {
  const totalLikes = await getTotalLikes(slug);
  const likesByUser = await getLikesByUser(slug);

  return (
    <div className="md:-translate-y-1/2 sticky top-0 z-50 md:fixed md:top-1/2 md:right-0 md:bottom-auto md:left-auto">
      <div className="flex w-full items-center justify-center gap-4 p-2 backdrop-blur-sm md:w-auto md:flex-col md:items-center md:rounded-lg md:bg-zinc-800/50 md:p-4">
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
