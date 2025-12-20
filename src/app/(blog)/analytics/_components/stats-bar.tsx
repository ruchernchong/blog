import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { headers } from "next/headers";
import { LikeCounter } from "@/app/(blog)/blog/_components/like-counter";
import { ViewCounter } from "@/app/(blog)/blog/_components/view-counter";
import { postStatsService } from "@/lib/services";
import { generateUserHash } from "@/utils/hash";

interface StatsBarProps {
  slug: string;
}

const getIpAddress = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0];
  }
  const realIp = headersList.get("x-real-ip");
  return realIp ?? "127.0.0.1";
};

const StatsBar = async ({ slug }: StatsBarProps) => {
  const userHash = generateUserHash(await getIpAddress());
  const totalLikes = await postStatsService.getTotalLikes(slug);
  const likesByUser = await postStatsService.getLikesByUser(slug, userHash);

  return (
    <div className="sticky top-0 z-50 md:fixed md:top-1/2 md:right-0 md:bottom-auto md:left-auto md:-translate-y-1/2">
      <div className="flex w-full items-center justify-center gap-4 p-2 md:w-auto md:flex-col md:items-center md:rounded-lg md:border md:border-border md:bg-card md:p-4">
        <LikeCounter
          slug={slug}
          initialTotalLikes={totalLikes}
          initialLikesByUser={likesByUser}
        />
        <div className="flex items-center gap-2 md:flex-col">
          <HugeiconsIcon
            icon={ViewIcon}
            size={24}
            strokeWidth={2}
            className="text-muted-foreground"
          />
          <ViewCounter slug={slug} />
        </div>
      </div>
    </div>
  );
};

export default StatsBar;
