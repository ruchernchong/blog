import { EyeIcon } from "@heroicons/react/24/outline";
import { LikeCounter } from "./LikeCounter";
import { ViewCounter } from "./ViewCounter";

interface StatsBarProps {
  slug: string;
}

const StatsBar = ({ slug }: StatsBarProps) => {
  return (
    <div className="hidden md:fixed md:inset-0 md:flex md:items-center md:justify-end">
      <div className="flex flex-col items-center gap-4 rounded-lg bg-gray-800/50 p-4 backdrop-blur">
        <LikeCounter slug={slug} />
        <div className="flex flex-col items-center gap-2">
          <EyeIcon className="h-6 w-6 text-neutral-400" />
          <ViewCounter slug={slug} />
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
