"use client";

import { useEffect, useState } from "react";
import { LikeButton } from "./LikeButton";
import { getLikesByUser, getTotalLikes } from "@/app/actions/stats";
import type { Likes } from "@/types";

interface Props {
  slug: string;
}

export const LikeCounter = ({ slug }: Props) => {
  const [totalLikes, setTotalLikes] = useState(0);
  const [totalLikesByUser, setTotalLikesByUser] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const [likes, userLikes] = await Promise.all([
        getTotalLikes(slug),
        getLikesByUser(slug),
      ]);

      setTotalLikes(likes);
      setTotalLikesByUser(userLikes);
    };

    void fetchData();
  }, [slug]);

  const handleLikeUpdate = ({ totalLikes, totalLikesByUser }: Likes) => {
    setTotalLikes(totalLikes);
    setTotalLikesByUser(totalLikesByUser);
  };

  return (
    <div className="flex items-center gap-2 md:flex-col">
      <LikeButton
        slug={slug}
        totalLikes={totalLikes}
        totalLikesByUser={totalLikesByUser}
        onLikeUpdateAction={handleLikeUpdate}
      />
      <div
        className="text-sm text-neutral-400"
        data-umami-event="like-counter-display"
        data-umami-event-slug={slug}
        data-umami-event-likes={totalLikes}
      >
        {totalLikes.toLocaleString()}
      </div>
    </div>
  );
};
