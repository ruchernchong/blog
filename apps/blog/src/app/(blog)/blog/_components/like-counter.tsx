"use client";

import { useState } from "react";
import type { Likes } from "@/types";
import LikeButton from "@/app/(blog)/blog/_components/like-button";

interface Props {
  slug: string;
  initialTotalLikes: number;
  initialLikesByUser: number;
}

export const LikeCounter = ({
  slug,
  initialTotalLikes,
  initialLikesByUser,
}: Props) => {
  const [totalLikes, setTotalLikes] = useState(initialTotalLikes);
  const [likesByUser, setLikesByUser] = useState(initialLikesByUser);

  const handleLikeUpdate = ({ totalLikes, likesByUser }: Likes) => {
    setTotalLikes(totalLikes);
    setLikesByUser(likesByUser);
  };

  return (
    <div className="flex items-center gap-2 md:flex-col">
      <LikeButton
        slug={slug}
        totalLikes={totalLikes}
        likesByUser={likesByUser}
        onLikeUpdateAction={handleLikeUpdate}
      />
      <div className="text-neutral-400 text-sm">
        {totalLikes.toLocaleString()}
      </div>
    </div>
  );
};
