"use client";

import { ViewIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useEffectEvent, useState } from "react";
import { incrementViews } from "@/app/_actions/stats";

// import { LikeCounter } from "@/app/(main)/blog/_components/like-counter";
// import { postStatsService } from "@/lib/services";
// import { getIpAddress } from "@/utils/get-ip-address";
// import { generateUserHash } from "@/utils/hash";

interface StatsBarProps {
  slug: string;
}

export function StatsBar({ slug }: StatsBarProps) {
  const [views, setViews] = useState<number | null>(null);

  const onTrackViews = useEffectEvent(async () => {
    const stats = await incrementViews(slug);
    setViews(stats.views);
  });

  useEffect(() => {
    onTrackViews();
  }, []);

  // const userHash = generateUserHash(await getIpAddress());
  // const totalLikes = await postStatsService.getTotalLikes(slug);
  // const likesByUser = await postStatsService.getLikesByUser(slug, userHash);

  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      {/* <LikeCounter
        slug={slug}
        initialTotalLikes={totalLikes}
        initialLikesByUser={likesByUser}
      /> */}
      <HugeiconsIcon icon={ViewIcon} size={20} strokeWidth={2} />
      <span className="text-sm">
        {views !== null ? views.toLocaleString() : "—"}
      </span>
    </div>
  );
}
