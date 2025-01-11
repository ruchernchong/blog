import { EyeIcon } from "@heroicons/react/24/outline";
import { LikeCounter } from "./LikeCounter";
import { ViewCounter } from "./ViewCounter";

interface StatsBarProps {
  slug: string;
}

export const StatsBar = ({ slug }: StatsBarProps) => {
  return (
    <div className="fixed bottom-8 right-8 xl:bottom-auto xl:right-8 xl:top-1/2 xl:-translate-y-1/2">
      <div className="flex flex-col items-center gap-6 rounded-lg bg-gray-800/50 p-4 backdrop-blur">
        <LikeCounter slug={slug} />
        <div className="flex flex-col items-center gap-2">
          <EyeIcon className="h-6 w-6 text-neutral-400" />
          <ViewCounter slug={slug} />
        </div>
      </div>
    </div>
  );
};